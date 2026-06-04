package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/store"
)

type Handler struct {
	Store *store.Store
}

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) ListCases(w http.ResponseWriter, _ *http.Request) {
	list := make([]caseSummary, 0)
	for _, raw := range h.Store.List() {
		s, err := extractSummary(raw)
		if err != nil {
			writeErr(w, http.StatusInternalServerError, "invalid case")
			return
		}
		list = append(list, s)
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *Handler) CaseSummary(w http.ResponseWriter, _ *http.Request) {
	list := make([]caseSummary, 0)
	for _, raw := range h.Store.List() {
		s, err := extractSummary(raw)
		if err != nil {
			writeErr(w, http.StatusInternalServerError, "invalid case")
			return
		}
		list = append(list, s)
	}
	writeJSON(w, http.StatusOK, computeSummaryCounts(list))
}

func (h *Handler) GetCase(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	raw, ok := h.Store.Get(id)
	if !ok {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}

func (h *Handler) DeleteCase(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !h.Store.Delete(id) {
		http.NotFound(w, r)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type classifyReq struct {
	CaseID *string `json:"caseId"`
	Text   string  `json:"text"`
}

func (h *Handler) Classify(w http.ResponseWriter, r *http.Request) {
	var req classifyReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	result, ok := legal.ClassifyRemote(req.Text)
	if !ok {
		result = legal.ClassifyText(req.Text)
	}
	if req.CaseID != nil && *req.CaseID != "" {
		raw, ok := h.Store.Get(*req.CaseID)
		if ok {
			updated, _ := patchCase(raw, map[string]any{
				"classification": result,
				"categoryCode":   result.CategoryCode,
				"status":         "classified",
				"step":           "classify",
			})
			updated, _ = appendStatusHistory(updated, "classify", "Kategoriya aniqlandi", "")
			h.Store.Put(*req.CaseID, updated)
		}
	}
	writeJSON(w, http.StatusOK, result)
}

type routeReq struct {
	CategoryCode string          `json:"categoryCode"`
	Facts        json.RawMessage `json:"facts"`
}

func (h *Handler) Route(w http.ResponseWriter, r *http.Request) {
	var req routeReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	route := legal.RouteForCategory(req.CategoryCode)
	caseID := r.URL.Query().Get("caseId")
	if caseID != "" {
		if raw, ok := h.Store.Get(caseID); ok {
			updated, _ := patchCase(raw, map[string]any{
				"route":  route,
				"status": "routed",
				"step":   "route",
			})
			updated, _ = appendStatusHistory(updated, "route", "Marshrut tayyorlandi", "")
			h.Store.Put(caseID, updated)
		}
	}
	writeJSON(w, http.StatusOK, route)
}

type caseIDBody struct {
	CaseID string `json:"caseId"`
}

type validateBody struct {
	CaseID     string `json:"caseId"`
	DocumentID string `json:"documentId"`
}

func (h *Handler) Validate(w http.ResponseWriter, r *http.Request) {
	var req validateBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	result := legal.DefaultWageValidation()
	raw, ok := h.Store.Get(req.CaseID)
	if ok {
		updated, _ := patchCase(raw, map[string]any{
			"validation": result,
			"status":     "validated",
			"step":       "validate",
		})
		updated, _ = appendStatusHistory(updated, "validate", "Tekshiruv o'tkazildi", "Ilovalar tekshirildi")
		h.Store.Put(req.CaseID, updated)
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) Export(w http.ResponseWriter, r *http.Request) {
	var req caseIDBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{
		"pdfUrl":      "/api/export/" + req.CaseID + ".pdf",
		"packageName": "areeza-topshiriq-" + req.CaseID + ".pdf",
	})
}

func (h *Handler) ExportPDF(w http.ResponseWriter, r *http.Request) {
	caseID := chi.URLParam(r, "caseId")
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `attachment; filename="areeza-`+caseID+`.pdf"`)
	// TODO(real): server-render court PDF from document HTML.
	_, _ = w.Write([]byte("%PDF-1.4\n% Areeza placeholder — wire HTML→PDF export\n"))
}

type updateDocBody struct {
	CaseID   string          `json:"caseId"`
	Document json.RawMessage `json:"document"`
}

func (h *Handler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	var req updateDocBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	raw, ok := h.Store.Get(req.CaseID)
	if !ok {
		http.NotFound(w, r)
		return
	}
	var doc map[string]any
	if err := json.Unmarshal(req.Document, &doc); err != nil {
		writeErr(w, http.StatusBadRequest, "bad document")
		return
	}
	var m map[string]any
	_ = json.Unmarshal(raw, &m)
	docs, _ := m["documents"].([]any)
	docID, _ := doc["id"].(string)
	replaced := false
	for i, d := range docs {
		if dm, ok := d.(map[string]any); ok && dm["id"] == docID {
			var newDoc any
			_ = json.Unmarshal(req.Document, &newDoc)
			docs[i] = newDoc
			replaced = true
			break
		}
	}
	if !replaced {
		var newDoc any
		_ = json.Unmarshal(req.Document, &newDoc)
		docs = append(docs, newDoc)
	}
	m["documents"] = docs
	if kind, _ := doc["kind"].(string); kind == "davo_arizasi" {
		m["document"] = doc
	}
	updated, _ := json.Marshal(m)
	h.Store.Put(req.CaseID, updated)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(req.Document)
}

type regenBody struct {
	CaseID      string  `json:"caseId"`
	DocumentID  string  `json:"documentId"`
	SectionID   string  `json:"sectionId"`
	Instruction *string `json:"instruction,omitempty"`
}

func (h *Handler) RegenerateSection(w http.ResponseWriter, r *http.Request) {
	var req regenBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	raw, ok := h.Store.Get(req.CaseID)
	if !ok {
		http.NotFound(w, r)
		return
	}
	var m map[string]any
	_ = json.Unmarshal(raw, &m)
	// Minimal stub: bump version on primary document.
	now := time.Now().UTC().Format(time.RFC3339)
	m["updatedAt"] = now
	updated, _ := json.Marshal(m)
	h.Store.Put(req.CaseID, updated)
	if doc, ok := m["document"]; ok {
		writeJSON(w, http.StatusOK, doc)
		return
	}
	writeErr(w, http.StatusNotFound, "document not found")
}

func (h *Handler) Draft(w http.ResponseWriter, r *http.Request) {
	var req caseIDBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	raw, ok := h.Store.Get(req.CaseID)
	if !ok {
		http.NotFound(w, r)
		return
	}
	var m map[string]any
	_ = json.Unmarshal(raw, &m)
	if doc, ok := m["document"]; ok {
		writeJSON(w, http.StatusOK, doc)
		return
	}
	writeErr(w, http.StatusNotFound, "no document on case")
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
