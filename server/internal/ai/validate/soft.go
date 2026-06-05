// Package validate is the optional Claude soft-pass over the deterministic validation
// result: only ambiguous items (the drafted body's adequacy) escalate to one sonnet
// structured call (CLAUDE.md: deterministic rule checks first, then one soft-pass).
package validate

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"

	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/pipeline/prompts"
	"github.com/romaluev/areeza/server/pkg/llm"
)

var softTool = llm.Tool{
	Name:        "soft_validate",
	Description: "Shubhali tekshiruv bandlarini hujjat matniga ko'ra baholaydi.",
	Schema: map[string]any{
		"checks": map[string]any{
			"type": "array",
			"items": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":     map[string]any{"type": "string"},
					"status": map[string]any{"type": "string", "enum": []string{"ok", "warn", "fail"}},
					"fix":    map[string]any{"type": "string"},
				},
				"required": []string{"id", "status"},
			},
		},
	},
	Required: []string{"checks"},
}

// SoftPass evaluates the ambiguous checks against the document text and returns refined
// {id, status, fix} entries (label left blank — the caller merges by id). Returns nil
// when there is nothing ambiguous to escalate.
func SoftPass(ctx context.Context, p *llm.Provider, docText string, ambiguous []legal.ValidationCheck) ([]legal.ValidationCheck, error) {
	if p == nil || len(ambiguous) == 0 {
		return nil, nil
	}
	var b strings.Builder
	b.WriteString("HUJJAT MATNI:\n")
	b.WriteString(docText)
	b.WriteString("\n\nSHUBHALI BANDLAR:\n")
	for _, c := range ambiguous {
		b.WriteString("- " + c.ID + ": " + c.Label + "\n")
	}

	raw, err := p.CallStructured(ctx, llm.CallOpts{
		Model:       llm.ModelSonnet,
		MaxTokens:   512,
		System:      prompts.ValidateSystem,
		CacheSystem: true,
	}, softTool, []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(b.String())),
	})
	if err != nil {
		return nil, err
	}
	var out struct {
		Checks []legal.ValidationCheck `json:"checks"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	return out.Checks, nil
}
