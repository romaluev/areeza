package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/websocket"

	"github.com/romaluev/areeza/server/internal/legal"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type intakeStart struct {
	CaseID *string `json:"caseId"`
	Text   string  `json:"text"`
}

// Scripted intake events (matches mock INTAKE_SCRIPT for wage demo).
func wageIntakeEvents(caseID string) []map[string]any {
	employerFact := map[string]any{
		"key": "employer_name", "label": "Ish beruvchi", "value": `"Oqtepa Logistics" MChJ`,
		"status": "collected", "group": "javobgar",
	}
	employerAddr := map[string]any{
		"key": "employer_address", "label": "Javobgar manzili",
		"value": "Toshkent sh., Yakkasaroy tumani, Shota Rustaveli ko'chasi, 78-uy",
		"status": "collected", "group": "javobgar",
	}
	salaryFact := map[string]any{
		"key": "salary_amount", "label": "Oylik ish haqi", "value": "4 200 000 so'm", "status": "collected",
	}
	monthsFact := map[string]any{
		"key": "unpaid_months", "label": "To'lanmagan oylar", "value": "Aprel–may 2026 (2 oy)", "status": "collected",
	}
	debtFact := map[string]any{
		"key": "debt_total", "label": "Jami qarz", "value": "8 400 000 so'm", "status": "collected",
	}
	cls := legal.ClassifyText("oylik to'lanmagan")

	return []map[string]any{
		{"type": "assistant_delta", "delta": "Tushundim — ish haqi to'lanmagan holat. "},
		{"type": "question", "question": "Ish beruvchingizning nomi va manzilini ayta olasizmi?", "factKey": "employer_name"},
		{"type": "fact", "fact": employerFact},
		{"type": "fact", "fact": employerAddr},
		{"type": "question", "question": "Lavozimingiz va oylik ish haqingiz qancha? Qaysi oylardan beri to'lanmagan?", "factKey": "salary_amount"},
		{"type": "fact", "fact": salaryFact},
		{"type": "fact", "fact": monthsFact},
		{"type": "fact", "fact": debtFact},
		{"type": "classified", "classification": cls},
		{"type": "done", "caseId": caseID},
	}
}

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
	text := start.Text
	if text == "" {
		text = "Ish beruvchim 2 oydan beri oyligimni to'lamayapti."
	}

	caseID := "case-intake-new"
	if start.CaseID != nil && *start.CaseID != "" {
		caseID = *start.CaseID
	}

	events := wageIntakeEvents(caseID)
	for _, ev := range events {
		time.Sleep(350 * time.Millisecond)
		if err := conn.WriteJSON(ev); err != nil {
			return
		}
	}

	// Persist classified state on case when it exists.
	if raw, ok := h.Store.Get(caseID); ok {
		cls := legal.ClassifyText(text)
		updated, _ := patchCase(raw, map[string]any{
			"classification": cls,
			"categoryCode":   cls.CategoryCode,
			"status":         "classified",
			"step":           "classify",
		})
		updated, _ = appendStatusHistory(updated, "classify", "Kategoriya aniqlandi", "")
		h.Store.Put(caseID, updated)
	}
}

type draftStart struct {
	CaseID     string `json:"caseId"`
	DocumentID string `json:"documentId"`
}

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
		_ = conn.WriteJSON(map[string]string{"type": "error", "message": "case not found"})
		return
	}

	var m map[string]any
	_ = json.Unmarshal(raw, &m)

	var template map[string]any
	if docs, ok := m["documents"].([]any); ok {
		for _, d := range docs {
			dm, ok := d.(map[string]any)
			if !ok {
				continue
			}
			if dm["id"] == start.DocumentID {
				template = dm
				break
			}
		}
	}
	if template == nil {
		if doc, ok := m["document"].(map[string]any); ok && doc["id"] == start.DocumentID {
			template = doc
		}
	}
	if template == nil {
		_ = conn.WriteJSON(map[string]string{"type": "error", "message": "document not found"})
		return
	}

	sections, _ := template["sections"].([]any)
	var built []map[string]any

	for _, sec := range sections {
		sm, ok := sec.(map[string]any)
		if !ok {
			continue
		}
		sid, _ := sm["id"].(string)
		kind, _ := sm["kind"].(string)
		content, _ := sm["content"].(string)

		_ = conn.WriteJSON(map[string]any{"type": "section_start", "sectionId": sid, "kind": kind})

		chunkSize := 14
		for i := 0; i < len(content); i += chunkSize {
			end := i + chunkSize
			if end > len(content) {
				end = len(content)
			}
			delta := content[i:end]
			time.Sleep(45 * time.Millisecond)
			_ = conn.WriteJSON(map[string]any{"type": "chunk", "sectionId": sid, "delta": delta})
		}

		doneSec := map[string]any{}
		for k, v := range sm {
			doneSec[k] = v
		}
		doneSec["content"] = content
		built = append(built, doneSec)
		_ = conn.WriteJSON(map[string]any{"type": "section_done", "sectionId": sid, "content": content})
	}

	final := map[string]any{}
	for k, v := range template {
		final[k] = v
	}
	final["sections"] = built
	final["status"] = "draft"
	if v, ok := template["version"].(float64); ok {
		final["version"] = int(v) + 1
	} else {
		final["version"] = 2
	}
	if pt, ok := template["plainText"].(string); ok && pt != "" {
		final["plainText"] = pt
	}

	_ = conn.WriteJSON(map[string]any{"type": "done", "document": final})

	updated, _ := patchCase(raw, map[string]any{
		"documents": []any{final},
		"document":  final,
		"status":    "drafted",
		"step":      "prepare",
	})
	updated, _ = appendStatusHistory(updated, "prepare", "Hujjat tayyorlandi", "")
	h.Store.Put(start.CaseID, updated)
}
