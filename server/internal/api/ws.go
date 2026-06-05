package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"github.com/romaluev/areeza/server/internal/ai/draft"
	"github.com/romaluev/areeza/server/internal/ai/intake"
	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/situation"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type intakeStart struct {
	// SituationID is the stable per-conversation key; the frontend keeps sending
	// "situation-intake-new" until the situation is finalized and minted.
	SituationID *string `json:"situationId"`
	CaseID      *string `json:"caseId"`
	Text        string  `json:"text"`
}

// IntakeWS runs one real intake turn through the Claude-driven brain. The brain
// holds conversation state server-side keyed by situationId: it streams events,
// and either asks one follow-up (socket closes without "done") or finalizes and
// emits "done" with the minted situation id.
func (h *Handler) IntakeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	var start intakeStart
	if err := conn.ReadJSON(&start); err != nil {
		return
	}

	situationID := "situation-intake-new"
	if start.SituationID != nil && *start.SituationID != "" {
		situationID = *start.SituationID
	} else if start.CaseID != nil && *start.CaseID != "" {
		situationID = *start.CaseID
	}

	if h.Brain == nil {
		_ = conn.WriteJSON(map[string]string{"type": "error", "message": "intake brain unavailable"})
		return
	}

	// Serialize writes (the brain emits from one goroutine, but guard anyway).
	var mu sync.Mutex
	emit := func(ev intake.Event) {
		mu.Lock()
		defer mu.Unlock()
		_ = conn.WriteJSON(ev)
	}

	ctx := r.Context()
	if err := h.Brain.RunTurn(ctx, h.Store, situationID, start.Text, emit); err != nil {
		emit(intake.Event{"type": "error", "message": err.Error()})
	}
}

type draftStart struct {
	CaseID     string `json:"caseId"`
	DocumentID string `json:"documentId"`
}

// DraftWS streams a REAL opus slot-fill of the situation's document: it fills the
// editable sections (bayonnoma, demand, attachments) grounded in the route + retrieved
// lex.uz articles, keeps non-editable sections (court header, title, footer) verbatim,
// streams the result section-by-section, then persists the document by id back into the
// situation and recomputes readiness. Degrades to the skeleton content when the opus
// drafter is unavailable so the demo never hard-fails.
func (h *Handler) DraftWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	var start draftStart
	if err := conn.ReadJSON(&start); err != nil {
		return
	}

	raw, ok := h.Store.Get(start.CaseID)
	if !ok {
		_ = conn.WriteJSON(map[string]string{"type": "error", "message": "situation not found"})
		return
	}
	var s situation.Situation
	if json.Unmarshal(raw, &s) != nil || s.ID == "" {
		_ = conn.WriteJSON(map[string]string{"type": "error", "message": "invalid situation"})
		return
	}

	docIdx := -1
	for i := range s.Documents {
		if s.Documents[i].ID == start.DocumentID {
			docIdx = i
			break
		}
	}
	if docIdx == -1 {
		_ = conn.WriteJSON(map[string]string{"type": "error", "message": "document not found"})
		return
	}
	doc := s.Documents[docIdx]

	// Grounding: the document's issue → route + category → fresh RAG article text.
	route, categoryCode := routeForDocument(&s, doc)
	articles, _ := legal.RetrieveArticles(categoryCode, factsQuery(s.Facts), 4)

	// Opus slot-fill (best-effort; fall back to skeleton content on failure).
	filledByID := map[string]string{}
	if h.Drafter != nil {
		filled, err := h.Drafter.Fill(r.Context(), draft.DraftInput{
			Kind:        doc.Kind,
			Skeleton:    doc.Sections,
			Route:       route,
			Articles:    articles,
			Facts:       s.Facts,
			Parties:     s.Parties,
			ClaimAmount: orStr(doc.ClaimAmount, s.ClaimAmount),
			Locale:      s.Locale,
		})
		if err != nil {
			_ = conn.WriteJSON(map[string]string{"type": "error", "message": "draft: " + err.Error()})
		} else {
			for _, f := range filled {
				filledByID[f.ID] = f.Content
			}
		}
	}

	// Stream sections: filled content for editable, verbatim skeleton otherwise.
	built := make([]situation.DocSection, 0, len(doc.Sections))
	var plain strings.Builder
	for _, sec := range doc.Sections {
		content := sec.Content
		if sec.Editable {
			if c, ok := filledByID[sec.ID]; ok && strings.TrimSpace(c) != "" {
				content = c
			}
		}

		_ = conn.WriteJSON(map[string]any{"type": "section_start", "sectionId": sec.ID, "kind": sec.Kind})
		for i := 0; i < len(content); i += draftChunk {
			end := i + draftChunk
			if end > len(content) {
				end = len(content)
			}
			time.Sleep(8 * time.Millisecond)
			_ = conn.WriteJSON(map[string]any{"type": "chunk", "sectionId": sec.ID, "delta": content[i:end]})
		}

		built = append(built, situation.DocSection{ID: sec.ID, Kind: sec.Kind, Content: content, Editable: sec.Editable})
		plain.WriteString(content + "\n\n")
		_ = conn.WriteJSON(map[string]any{"type": "section_done", "sectionId": sec.ID, "content": content})
	}

	doc.Sections = built
	doc.PlainText = strings.TrimSpace(plain.String())
	doc.Version++
	doc.Status = "draft"
	s.Documents[docIdx] = doc
	s.RecomputeReadiness()
	s.StatusHistory = append(s.StatusHistory, situation.StatusEvent{
		Step: "prepare", Label: "Hujjat tayyorlandi", At: time.Now().UTC().Format(time.RFC3339),
	})
	if out, err := json.Marshal(&s); err == nil {
		h.Store.Put(s.ID, out)
	}

	_ = conn.WriteJSON(map[string]any{"type": "done", "document": doc})
}

const draftChunk = 24

// routeForDocument finds the issue backing a document and returns its route + category.
func routeForDocument(s *situation.Situation, doc situation.Document) (legal.LegalRoute, string) {
	issueID := s.ActiveIssueID
	if len(doc.IssueIDs) > 0 {
		issueID = doc.IssueIDs[0]
	}
	for _, iss := range s.Issues {
		if iss.ID == issueID || issueID == "" {
			route := legal.LegalRoute{}
			if iss.Route != nil {
				route = *iss.Route
			}
			return route, iss.CategoryCode
		}
	}
	return legal.LegalRoute{}, ""
}

// factsQuery builds a short retrieval query from the collected facts.
func factsQuery(facts []situation.Fact) string {
	parts := make([]string, 0, len(facts))
	for _, f := range facts {
		parts = append(parts, f.Label+": "+f.Value)
	}
	return strings.Join(parts, "; ")
}

func orStr(a, b string) string {
	if strings.TrimSpace(a) != "" {
		return a
	}
	return b
}
