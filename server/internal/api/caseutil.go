package api

import (
	"encoding/json"
	"time"
)

type caseSummary struct {
	ID           string  `json:"id"`
	Title        string  `json:"title"`
	Status       string  `json:"status"`
	Step         string  `json:"step"`
	CategoryCode *string `json:"categoryCode,omitempty"`
	ClaimAmount  *string `json:"claimAmount,omitempty"`
	Currency     string  `json:"currency"`
	CreatedAt    string  `json:"createdAt"`
	UpdatedAt    string  `json:"updatedAt"`
}

type summaryCounts struct {
	Total      int `json:"total"`
	Intake     int `json:"intake"`
	InProgress int `json:"inProgress"`
	Draft      int `json:"draft"`
	Ready      int `json:"ready"`
}

func extractSummary(raw json.RawMessage) (caseSummary, error) {
	var s caseSummary
	return s, json.Unmarshal(raw, &s)
}

func computeSummaryCounts(cases []caseSummary) summaryCounts {
	c := summaryCounts{Total: len(cases)}
	for _, item := range cases {
		switch item.Status {
		case "intake":
			c.Intake++
		case "ready":
			c.Ready++
		case "validated", "drafted":
			c.Draft++
		case "classified", "routed", "draft":
			c.InProgress++
		}
	}
	return c
}

func patchCase(raw json.RawMessage, patch map[string]any) (json.RawMessage, error) {
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return nil, err
	}
	for k, v := range patch {
		m[k] = v
	}
	m["updatedAt"] = time.Now().UTC().Format(time.RFC3339)
	return json.Marshal(m)
}

func appendStatusHistory(raw json.RawMessage, step, label, note string) (json.RawMessage, error) {
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return nil, err
	}
	entry := map[string]any{
		"step":  step,
		"label": label,
		"at":    time.Now().UTC().Format(time.RFC3339),
	}
	if note != "" {
		entry["note"] = note
	}
	var hist []any
	if h, ok := m["statusHistory"].([]any); ok {
		hist = h
	}
	hist = append(hist, entry)
	m["statusHistory"] = hist
	return json.Marshal(m)
}
