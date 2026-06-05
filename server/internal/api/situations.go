package api

import (
	"encoding/json"
	"net/http"
	"time"

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

// MoveIssue is the kanban drag persistence: PATCH /api/situations/{id}/issues/{issueId}
// with body { step, position? }. Pure state move on the issue inside the situation JSON —
// no legal/pipeline logic. Returns the full updated Situation.
func (h *Handler) MoveIssue(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	issueID := chi.URLParam(r, "issueId")

	var req struct {
		Step     string   `json:"step"`
		Position *float64 `json:"position,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	if req.Step == "" {
		writeErr(w, http.StatusBadRequest, "missing step")
		return
	}

	raw, ok := h.Store.Get(id)
	if !ok {
		http.NotFound(w, r)
		return
	}

	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		writeErr(w, http.StatusInternalServerError, "corrupt situation")
		return
	}
	issues, _ := m["issues"].([]any)
	found := false
	for _, it := range issues {
		issue, ok := it.(map[string]any)
		if !ok || issue["id"] != issueID {
			continue
		}
		issue["step"] = req.Step
		if req.Position != nil {
			issue["position"] = *req.Position
		}
		found = true
		break
	}
	if !found {
		http.NotFound(w, r)
		return
	}

	m["updatedAt"] = time.Now().UTC().Format(time.RFC3339)
	updated, err := json.Marshal(m)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "marshal failed")
		return
	}
	h.Store.Put(id, updated)
	writeJSON(w, http.StatusOK, json.RawMessage(updated))
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
