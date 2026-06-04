package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// SituationHandlers serve the multi-issue aggregate (JSON passthrough; seed from TS fixtures).
func (h *Handler) ListSituations(w http.ResponseWriter, r *http.Request) {
	list := h.Store.List()
	var out []json.RawMessage
	for _, raw := range list {
		var m map[string]any
		if json.Unmarshal(raw, &m) == nil {
			if _, ok := m["issues"]; ok {
				out = append(out, raw)
			}
		}
	}
	if len(out) == 0 {
		out = list
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *Handler) GetSituation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	raw, ok := h.Store.Get(id)
	if !ok {
		http.NotFound(w, r)
		return
	}
	writeJSON(w, http.StatusOK, raw)
}

func (h *Handler) DeleteSituation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !h.Store.Delete(id) {
		http.NotFound(w, r)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) SituationSummary(w http.ResponseWriter, r *http.Request) {
	list := h.Store.List()
	c := summaryCounts{}
	for _, raw := range list {
		var item caseSummary
		if json.Unmarshal(raw, &item) != nil {
			continue
		}
		c.Total++
		switch item.Status {
		case "intake":
			c.Intake++
		case "ready":
			c.Ready++
		case "validated", "in_progress":
			c.Draft++
		default:
			c.InProgress++
		}
	}
	writeJSON(w, http.StatusOK, c)
}
