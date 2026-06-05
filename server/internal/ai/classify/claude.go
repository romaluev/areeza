// Package classify is the Claude-enum cloud-backup classifier — the last tier in the
// routing chain (legal.Classifier) before the deterministic keyword floor. It runs one
// Haiku structured-output call (cheap extraction; CLAUDE.md token discipline) and is
// injected as a legal.ClaudeEnumFunc so the legal package stays provider-free.
package classify

import (
	"context"
	"encoding/json"

	"github.com/anthropics/anthropic-sdk-go"

	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/pipeline/prompts"
	"github.com/romaluev/areeza/server/pkg/llm"
)

// enumTool forces a single structured classification into the shared contract.
var enumTool = llm.Tool{
	Name:        "classify_legal_situation",
	Description: "Fuqaroning yuridik holatini bitta toifaga ajratadi (navigatsiya, maslahat emas).",
	Schema: map[string]any{
		"categoryCode": map[string]any{
			"type":        "string",
			"enum":        legal.CategoryCodes,
			"description": "eng mos toifa kodi",
		},
		"confidence": map[string]any{"type": "number", "description": "0..1 ishonch darajasi"},
		"track": map[string]any{
			"type":        "string",
			"enum":        []string{"claim", "court_order"},
			"description": "da'vo tartibi (claim) yoki sud buyrug'i tartibi (court_order)",
		},
		"rationale": map[string]any{"type": "string", "description": "qisqa o'zbekcha izoh"},
	},
	Required: []string{"categoryCode", "confidence", "track", "rationale"},
}

type enumResult struct {
	CategoryCode string  `json:"categoryCode"`
	Confidence   float64 `json:"confidence"`
	Track        string  `json:"track"`
	Rationale    string  `json:"rationale"`
}

// NewEnumClassifier returns a legal.ClaudeEnumFunc bound to the provider (Haiku).
func NewEnumClassifier(p *llm.Provider) legal.ClaudeEnumFunc {
	return func(ctx context.Context, text string) (legal.Classification, bool) {
		raw, err := p.CallStructured(ctx, llm.CallOpts{
			Model:       llm.ModelHaiku,
			MaxTokens:   256,
			System:      prompts.ClassifyEnumSystem,
			CacheSystem: true,
		}, enumTool, []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(text)),
		})
		if err != nil {
			return legal.Classification{}, false
		}
		var r enumResult
		if err := json.Unmarshal(raw, &r); err != nil || r.CategoryCode == "" {
			return legal.Classification{}, false
		}
		return legal.Compose(r.CategoryCode, r.Confidence, r.Track, r.Rationale), true
	}
}
