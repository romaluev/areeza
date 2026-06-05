// Package draft is the opus-backed document slot-fill: it fills the editable sections
// of a fixed court-document skeleton (CPC Art-189 da'vo arizasi etc.) with real legal
// narrative grounded in the route + retrieved articles. Opus only, for the final
// document (CLAUDE.md). The model never invents the legal structure — non-editable
// sections are kept verbatim by the WS layer.
package draft

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"

	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/pipeline/prompts"
	"github.com/romaluev/areeza/server/internal/situation"
	"github.com/romaluev/areeza/server/pkg/llm"
)

type Drafter struct{ llm *llm.Provider }

func New(p *llm.Provider) *Drafter { return &Drafter{llm: p} }

// DraftInput is everything the slot-fill needs. Skeleton + Route + Articles form the
// cached legal block; Facts/Parties/ClaimAmount are the per-situation delta.
type DraftInput struct {
	Kind        string
	Skeleton    []situation.DocSection
	Route       legal.LegalRoute
	Articles    []legal.Article
	Facts       []situation.Fact
	Parties     []situation.Party
	ClaimAmount string
	Locale      string
}

// FilledSection is one filled editable section returned by the model.
type FilledSection struct {
	ID      string `json:"id"`
	Content string `json:"content"`
}

var fillTool = llm.Tool{
	Name:        "fill_davo_arizasi",
	Description: "Ariza hujjatining tahrirlanadigan bo'limlarini real yuridik matn bilan to'ldiradi.",
	Schema: map[string]any{
		"sections": map[string]any{
			"type":        "array",
			"description": "har bir tahrirlanadigan bo'lim",
			"items": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":      map[string]any{"type": "string", "description": "bo'lim id'si"},
					"content": map[string]any{"type": "string", "description": "to'liq bo'lim matni"},
				},
				"required": []string{"id", "content"},
			},
		},
	},
	Required: []string{"sections"},
}

var regenTool = llm.Tool{
	Name:        "regenerate_section",
	Description: "Bitta bo'limni foydalanuvchi ko'rsatmasiga ko'ra qayta yozadi.",
	Schema: map[string]any{
		"id":      map[string]any{"type": "string"},
		"content": map[string]any{"type": "string"},
	},
	Required: []string{"id", "content"},
}

// Fill runs ONE opus structured call returning all editable sections filled. The legal
// block is cached so a later regenerate on the same situation hits the prompt cache.
func (d *Drafter) Fill(ctx context.Context, in DraftInput) ([]FilledSection, error) {
	raw, err := d.llm.CallStructured(ctx, llm.CallOpts{
		Model:       llm.ModelOpus,
		MaxTokens:   4096,
		System:      prompts.DraftSystem,
		CacheSystem: true,
	}, fillTool, []anthropic.MessageParam{
		anthropic.NewUserMessage(
			llm.CachedTextBlock(legalBlock(in)),
			anthropic.NewTextBlock(factsBlock(in)),
		),
	})
	if err != nil {
		return nil, err
	}
	var out struct {
		Sections []FilledSection `json:"sections"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	return out.Sections, nil
}

// RegenerateOne re-writes a single section per the user's instruction, reusing the same
// cached legal block (cache hit) so revision is cheap. This is the "recall the AI
// agents on a section" path.
func (d *Drafter) RegenerateOne(ctx context.Context, in DraftInput, sectionID, current, instruction string) (FilledSection, error) {
	var delta strings.Builder
	delta.WriteString(factsBlock(in))
	delta.WriteString("\n\nQAYTA YOZILADIGAN BO'LIM: " + sectionID + "\n")
	if strings.TrimSpace(current) != "" {
		delta.WriteString("Joriy matn:\n" + current + "\n")
	}
	if strings.TrimSpace(instruction) != "" {
		delta.WriteString("\nFoydalanuvchi ko'rsatmasi: " + instruction + "\n")
	}
	delta.WriteString("\nShu bitta bo'limni yangilab, regenerate_section asbobi orqali {id, content} qaytaring.")

	raw, err := d.llm.CallStructured(ctx, llm.CallOpts{
		Model:       llm.ModelOpus,
		MaxTokens:   2048,
		System:      prompts.DraftSystem,
		CacheSystem: true,
	}, regenTool, []anthropic.MessageParam{
		anthropic.NewUserMessage(
			llm.CachedTextBlock(legalBlock(in)),
			anthropic.NewTextBlock(delta.String()),
		),
	})
	if err != nil {
		return FilledSection{}, err
	}
	var out FilledSection
	if err := json.Unmarshal(raw, &out); err != nil {
		return FilledSection{}, err
	}
	if out.ID == "" {
		out.ID = sectionID
	}
	return out, nil
}

// legalBlock is the cached context: document kind, the editable/non-editable skeleton,
// the route rules, and the retrieved lex.uz articles (the legal grounding).
func legalBlock(in DraftInput) string {
	var b strings.Builder
	b.WriteString("HUJJAT TURI: " + in.Kind + "\n\n")

	b.WriteString("HUJJAT TUZILMASI (bo'limlar):\n")
	for _, s := range in.Skeleton {
		ed := "tayyor (tegmang)"
		if s.Editable {
			ed = "TO'LDIRILADI"
		}
		b.WriteString(fmt.Sprintf("- [%s] %s (%s): %s\n", s.ID, s.Kind, ed, oneLine(s.Content)))
	}

	b.WriteString("\nMARSHRUT (huquqiy yo'nalish):\n")
	b.WriteString("- Sud/organ: " + in.Route.Court + "\n")
	b.WriteString("- Ariza turi: " + in.Route.ApplicationType + "\n")
	if in.Route.Limitation != "" {
		b.WriteString("- Muddat: " + in.Route.Limitation + "\n")
	}
	if in.Route.FeeNote != "" {
		b.WriteString("- Davlat boji: " + in.Route.FeeNote + "\n")
	}
	if len(in.Route.LegalBasis) > 0 {
		b.WriteString("- Huquqiy asos: " + strings.Join(in.Route.LegalBasis, "; ") + "\n")
	}
	if len(in.Route.RequiredDocuments) > 0 {
		b.WriteString("- Zarur hujjatlar (ilova uchun): " + strings.Join(in.Route.RequiredDocuments, "; ") + "\n")
	}

	if len(in.Articles) > 0 {
		b.WriteString("\nQONUN MODDALARI (faqat shularga tayaning):\n")
		for _, a := range in.Articles {
			b.WriteString("• " + legal.CitationLine(a) + "\n")
			if t := oneLine(a.Text); t != "" {
				b.WriteString("  " + t + "\n")
			}
		}
	}
	return b.String()
}

// factsBlock is the per-situation delta (uncached): collected facts, parties, amount.
func factsBlock(in DraftInput) string {
	var b strings.Builder
	b.WriteString("FUQARO BERGAN FAKTLAR:\n")
	if len(in.Facts) == 0 {
		b.WriteString("(fakt yo'q)\n")
	}
	for _, f := range in.Facts {
		b.WriteString(fmt.Sprintf("- %s: %s\n", f.Label, f.Value))
	}
	if len(in.Parties) > 0 {
		b.WriteString("\nTOMONLAR:\n")
		for _, p := range in.Parties {
			line := "- " + p.Role + ": " + p.Name
			if addr := p.Requisites["manzil"]; addr != "" {
				line += ", " + addr
			}
			if stir := p.Requisites["STIR"]; stir != "" {
				line += ", STIR " + stir
			}
			b.WriteString(line + "\n")
		}
	}
	if strings.TrimSpace(in.ClaimAmount) != "" {
		b.WriteString("\nTALAB SUMMASI: " + in.ClaimAmount + "\n")
	}
	return b.String()
}

func oneLine(s string) string {
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.TrimSpace(s)
	if len(s) > 600 {
		s = s[:600] + "…"
	}
	return s
}
