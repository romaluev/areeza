// Package intake is the real, Claude-driven intake brain: a multi-turn loop with
// tools (record_fact, ask_followup, finalize). It keeps conversation state in the
// store keyed by situationId — the frontend opens a fresh WebSocket per turn and
// sends only the latest message, so context lives server-side (CLAUDE.md §5b: the
// model sees the structured facts + last message, never the transcript).
package intake

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/anthropics/anthropic-sdk-go"

	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/pipeline/prompts"
	"github.com/romaluev/areeza/server/internal/situation"
	"github.com/romaluev/areeza/server/pkg/llm"
)

// Store is the minimal persistence the brain needs (satisfied by store.Store).
type Store interface {
	Get(id string) (json.RawMessage, bool)
	Put(id string, data json.RawMessage)
	Delete(id string) bool
}

// Event is one IntakeEvent forwarded to the WebSocket (matches packages/core).
type Event map[string]any

// Brain runs the intake conversation against Claude.
type Brain struct {
	llm *llm.Provider
	// Classifier is the routing chain (tier1→tier2→Claude→keyword) used at finalize.
	// nil → finalize falls back to the deterministic keyword router.
	Classifier *legal.Classifier
}

func New(p *llm.Provider) *Brain { return &Brain{llm: p} }

// classify runs the routing chain when configured, else the keyword floor.
func (b *Brain) classify(ctx context.Context, text string) legal.Classification {
	if b.Classifier != nil {
		return b.Classifier.Classify(ctx, text)
	}
	return legal.ClassifyText(text)
}

// maxToolIterations bounds the per-turn tool loop (record_fact rounds before a
// control tool fires).
const maxToolIterations = 5

var intakeTools = []llm.Tool{
	{
		Name:        "record_fact",
		Description: "Foydalanuvchi xabaridan aniqlangan bitta faktni yozib oladi.",
		Schema: map[string]any{
			"key":    map[string]any{"type": "string", "description": "inglizcha snake_case kalit, masalan employer_name"},
			"label":  map[string]any{"type": "string", "description": "o'zbekcha qisqa nom"},
			"value":  map[string]any{"type": "string", "description": "fakt qiymati"},
			"group":  map[string]any{"type": "string", "description": "ixtiyoriy guruh: javobgar | talab | dalil"},
			"status": map[string]any{"type": "string", "enum": []string{"collected", "missing", "optional"}},
		},
		Required: []string{"key", "label", "value"},
	},
	{
		Name:        "ask_followup",
		Description: "Fuqaroga bitta aniq keyingi savol beradi. Bir vaqtda faqat bitta savol.",
		Schema: map[string]any{
			"question": map[string]any{"type": "string", "description": "beriladigan yagona savol"},
			"options": map[string]any{
				"type":        "array",
				"items":       map[string]any{"type": "string"},
				"description": "ixtiyoriy 2-4 ta tanlov varianti",
			},
		},
		Required: []string{"question"},
	},
	{
		Name:        "finalize",
		Description: "Yetarli faktlar yig'ilganda holatni yakunlaydi va ish hujjati tayyorlash bosqichiga o'tkazadi.",
		Schema: map[string]any{
			"title":       map[string]any{"type": "string", "description": "holatning qisqa sarlavhasi"},
			"summary":     map[string]any{"type": "string", "description": "holatning 1-2 jumlalik mohiyati (tasniflash uchun)"},
			"claimAmount": map[string]any{"type": "string", "description": "ixtiyoriy: talab summasi"},
			"severity":    map[string]any{"type": "string", "enum": []string{"critical", "high", "medium", "low"}},
		},
		Required: []string{"title", "summary"},
	},
}

// RunTurn processes one user message for situationId, streaming IntakeEvents via emit.
// It returns after either asking a follow-up (no "done") or finalizing (emits "done").
func (b *Brain) RunTurn(ctx context.Context, st Store, situationID, userText string, emit func(Event)) error {
	s := loadWorking(st, situationID)
	if isCyrillic(userText) {
		s.Locale = "ru"
	}

	// Confirm gate: if the previous turn proposed legal sources, this turn is the
	// user's confirm (→ finalize) or correction (→ re-collect and re-propose).
	if p, ok := loadPending(st, situationID); ok {
		clearPending(st, situationID)
		if isConfirm(userText) {
			s.Messages = append(s.Messages, situation.Message{
				ID:        newID("m-"),
				Role:      "user",
				Content:   userText,
				CreatedAt: nowRFC(),
			})
			save(st, situationID, s)
			return b.confirmAndFinalize(ctx, st, situationID, s, p, emit)
		}
		// Rejection/edit: fall through to the normal loop and treat the text as a
		// correction; the model re-collects and re-proposes sources at finalize.
	}

	// A finalized situation (issues>0) means a follow-up: answer + record facts, but
	// never re-finalize (that would mint a duplicate). Different tools + system prompt.
	followUp := len(s.Issues) > 0
	tools := intakeTools
	system := prompts.IntakeSystem
	if followUp {
		tools = followUpTools
		system = prompts.FollowUpSystem
	}

	lastQuestion := lastAssistantMessage(s)
	s.Messages = append(s.Messages, situation.Message{
		ID:        newID("m-"),
		Role:      "user",
		Content:   userText,
		CreatedAt: nowRFC(),
	})
	save(st, situationID, s)

	msgs := []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(buildContext(s, lastQuestion, userText))),
	}

	var streamed strings.Builder
	onText := func(t string) {
		streamed.WriteString(t)
		emit(Event{"type": "assistant_delta", "delta": t})
	}

	for i := 0; i < maxToolIterations; i++ {
		res, err := b.llm.StreamTurn(ctx, system, tools, msgs, onText)
		if err != nil {
			return err
		}

		var control *llm.ToolCall
		assistantBlocks := []anthropic.ContentBlockParamUnion{}
		if res.Text != "" {
			assistantBlocks = append(assistantBlocks, anthropic.NewTextBlock(res.Text))
		}
		toolResults := []anthropic.ContentBlockParamUnion{}

		for idx := range res.ToolCalls {
			tc := res.ToolCalls[idx]
			var inputMap map[string]any
			_ = json.Unmarshal(tc.Input, &inputMap)
			assistantBlocks = append(assistantBlocks, anthropic.NewToolUseBlock(tc.ID, inputMap, tc.Name))

			switch tc.Name {
			case "record_fact":
				f := factFromInput(inputMap)
				if f.Key != "" {
					s.UpsertFact(f)
					emit(Event{"type": "fact", "fact": f})
				}
				toolResults = append(toolResults, anthropic.NewToolResultBlock(tc.ID, "ok", false))
			case "ask_followup", "finalize":
				c := tc
				control = &c
			}
		}

		if control != nil {
			var inputMap map[string]any
			_ = json.Unmarshal(control.Input, &inputMap)
			if control.Name == "ask_followup" {
				return b.handleFollowup(st, situationID, s, streamed.String(), inputMap, emit)
			}
			return b.proposeSources(ctx, st, situationID, s, finalizeFromInput(inputMap), emit)
		}

		// No control tool yet — feed tool results back and nudge toward a decision.
		if len(assistantBlocks) > 0 {
			msgs = append(msgs, anthropic.NewAssistantMessage(assistantBlocks...))
		}
		nudge := append(toolResults, anthropic.NewTextBlock("Davom eting: bitta ask_followup bering yoki yetarli bo'lsa finalize chaqiring."))
		msgs = append(msgs, anthropic.NewUserMessage(nudge...))
	}

	// Safety net: never leave the turn without a question.
	return b.handleFollowup(st, situationID, s, streamed.String(),
		map[string]any{"question": "Holatingiz haqida yana qanday muhim ma'lumot bera olasiz?"}, emit)
}

func (b *Brain) handleFollowup(st Store, situationID string, s *situation.Situation, preamble string, in map[string]any, emit func(Event)) error {
	question, _ := in["question"].(string)
	options := stringSlice(in["options"])

	delta := question
	if strings.TrimSpace(preamble) != "" {
		delta = "\n\n" + question
	}
	emit(Event{"type": "assistant_delta", "delta": delta})

	ev := Event{"type": "question", "question": question}
	if len(options) > 0 {
		ev["options"] = options
	}
	emit(ev)

	content := strings.TrimSpace(preamble)
	if content != "" {
		content += "\n\n"
	}
	content += question
	s.Messages = append(s.Messages, situation.Message{
		ID:        newID("m-"),
		Role:      "assistant",
		Content:   content,
		CreatedAt: nowRFC(),
	})
	save(st, situationID, s)
	return nil
}

// --- working-state + context helpers ---

func loadWorking(st Store, id string) *situation.Situation {
	if raw, ok := st.Get(id); ok {
		var s situation.Situation
		if json.Unmarshal(raw, &s) == nil && s.ID != "" {
			// Return the existing situation whether or not it's finalized — a finalized
			// aggregate (issues>0) means the user came back to the chat step for a
			// follow-up, and we must NOT overwrite it with an empty draft. RunTurn
			// switches to follow-up mode (no re-finalize) when issues are present.
			ensureSlices(&s)
			return &s
		}
	}
	return situation.New(id, "uz", "UZS", nowRFC())
}

func ensureSlices(s *situation.Situation) {
	if s.Messages == nil {
		s.Messages = []situation.Message{}
	}
	if s.Facts == nil {
		s.Facts = []situation.Fact{}
	}
	if s.Issues == nil {
		s.Issues = []situation.Issue{}
	}
	if s.Parties == nil {
		s.Parties = []situation.Party{}
	}
	if s.Evidence == nil {
		s.Evidence = []situation.Evidence{}
	}
	if s.Timeline == nil {
		s.Timeline = []situation.TimelineEvent{}
	}
	if s.Documents == nil {
		s.Documents = []situation.Document{}
	}
	if s.Advisories == nil {
		s.Advisories = []situation.Advisory{}
	}
}

func save(st Store, id string, s *situation.Situation) {
	s.UpdatedAt = nowRFC()
	raw, err := json.Marshal(s)
	if err == nil {
		st.Put(id, raw)
	}
}

func buildContext(s *situation.Situation, lastQuestion, userText string) string {
	var sb strings.Builder
	sb.WriteString("Hozirgacha yig'ilgan faktlar:\n")
	if len(s.Facts) == 0 {
		sb.WriteString("(hali fakt yig'ilmagan)\n")
	} else {
		for _, f := range s.Facts {
			sb.WriteString(fmt.Sprintf("- %s (%s): %s\n", f.Label, f.Key, f.Value))
		}
	}
	if strings.TrimSpace(lastQuestion) != "" {
		sb.WriteString("\nOxirgi bergan savolingiz:\n" + lastQuestion + "\n")
	}
	sb.WriteString("\nFuqaro hozir shunday dedi:\n\"" + userText + "\"\n")
	sb.WriteString("\nAvval shu xabardan yangi faktlarni record_fact bilan yozing, so'ng bitta keyingi savolni ask_followup bilan bering yoki yetarli bo'lsa finalize chaqiring.")
	return sb.String()
}

func lastAssistantMessage(s *situation.Situation) string {
	for i := len(s.Messages) - 1; i >= 0; i-- {
		if s.Messages[i].Role == "assistant" {
			return s.Messages[i].Content
		}
	}
	return ""
}

func factFromInput(in map[string]any) situation.Fact {
	status, _ := in["status"].(string)
	if status == "" {
		status = "collected"
	}
	return situation.Fact{
		Key:    str(in["key"]),
		Label:  str(in["label"]),
		Value:  str(in["value"]),
		Group:  str(in["group"]),
		Status: status,
	}
}

type finalizeInput struct {
	Title       string
	Summary     string
	ClaimAmount string
	Severity    string
}

func finalizeFromInput(in map[string]any) finalizeInput {
	sev := str(in["severity"])
	switch sev {
	case "critical", "high", "medium", "low":
	default:
		sev = "high"
	}
	return finalizeInput{
		Title:       str(in["title"]),
		Summary:     str(in["summary"]),
		ClaimAmount: str(in["claimAmount"]),
		Severity:    sev,
	}
}

// --- small utils ---

func str(v any) string {
	s, _ := v.(string)
	return strings.TrimSpace(s)
}

func stringSlice(v any) []string {
	arr, ok := v.([]any)
	if !ok {
		return nil
	}
	out := make([]string, 0, len(arr))
	for _, e := range arr {
		if s, ok := e.(string); ok && strings.TrimSpace(s) != "" {
			out = append(out, s)
		}
	}
	return out
}

// isConfirm reports whether the user's turn confirms the proposed legal sources.
// Permissive across uz/ru plus the explicit "Tasdiqlayman" button label; short tokens
// are matched exactly to avoid false positives on substrings.
func isConfirm(text string) bool {
	t := strings.ToLower(strings.TrimSpace(text))
	switch t {
	case "ha", "да", "yes", "ok", "okay", "roziman", "tasdiqlayman", "подтверждаю":
		return true
	}
	for _, kw := range []string{"tasdiq", "подтвер", "confirm", "davom etamiz", "ha, to'g'ri", "да, верно", "согласен", "to'g'ri, davom"} {
		if strings.Contains(t, kw) {
			return true
		}
	}
	return false
}

func isCyrillic(s string) bool {
	for _, r := range s {
		if r >= 0x0400 && r <= 0x04FF {
			return true
		}
	}
	return false
}

func newID(prefix string) string {
	b := make([]byte, 5)
	_, _ = rand.Read(b)
	return prefix + hex.EncodeToString(b)
}

func nowRFC() string { return time.Now().UTC().Format(time.RFC3339) }
