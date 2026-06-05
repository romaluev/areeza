// Package situation defines the rich Situation aggregate the web workspace consumes.
// Field shapes mirror packages/core/src/types/index.ts (situationSchema and friends);
// all slices stay non-nil so they marshal as [] not null (zod requires arrays).
package situation

import "github.com/romaluev/areeza/server/internal/legal"

type Fact struct {
	Key    string `json:"key"`
	Label  string `json:"label"`
	Value  string `json:"value"`
	Status string `json:"status"` // collected | missing | optional
	Group  string `json:"group,omitempty"`
}

type Message struct {
	ID        string `json:"id"`
	Role      string `json:"role"` // user | assistant | system
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
	IssueID   string `json:"issueId,omitempty"`
}

type Issue struct {
	ID             string                `json:"id"`
	CategoryCode   string                `json:"categoryCode"`
	SubType        string                `json:"subType,omitempty"`
	Title          string                `json:"title"`
	Severity       string                `json:"severity"` // critical | high | medium | low
	Rationale      string                `json:"rationale"`
	Classification *legal.Classification `json:"classification,omitempty"`
	Route          *legal.LegalRoute     `json:"route,omitempty"`
	Step           string                `json:"step"`   // describe|classify|route|prepare|validate|submit
	Status         string                `json:"status"` // caseStatus
	Position       *float64              `json:"position,omitempty"`
}

type Party struct {
	ID         string            `json:"id"`
	Role       string            `json:"role"` // plaintiff|defendant|witness|third_party|accomplice
	Kind       string            `json:"kind"` // person|organization|gov_agency
	Name       string            `json:"name"`
	Requisites map[string]string `json:"requisites"`
	IssueIDs   []string          `json:"issueIds"`
}

type Evidence struct {
	ID          string   `json:"id"`
	Kind        string   `json:"kind"` // contract|receipt|correspondence|photo|witness_statement|official_record|other
	Title       string   `json:"title"`
	FileURL     string   `json:"fileUrl,omitempty"`
	Date        string   `json:"date,omitempty"`
	Notes       string   `json:"notes,omitempty"`
	Status      string   `json:"status"` // pending|uploaded|verified
	IssueIDs    []string `json:"issueIds"`
	DocumentIDs []string `json:"documentIds"`
}

type TimelineEvent struct {
	ID       string   `json:"id"`
	Date     string   `json:"date"`
	Label    string   `json:"label"`
	Kind     string   `json:"kind"` // fact|deadline|manual
	IssueIDs []string `json:"issueIds"`
}

type Advisory struct {
	ID          string   `json:"id"`
	Kind        string   `json:"kind"`     // deadline_warning|evidence_gap|jurisdiction_alert|strategic_recommendation|human_review_required|compliance_note
	Severity    string   `json:"severity"` // urgent|high|medium|info
	Title       string   `json:"title"`
	Body        string   `json:"body"`
	Status      string   `json:"status"` // open|acknowledged|resolved
	IssueIDs    []string `json:"issueIds"`
	DocumentIDs []string `json:"documentIds"`
}

type DocSection struct {
	ID       string `json:"id"`
	Kind     string `json:"kind"`
	Content  string `json:"content"`
	Editable bool   `json:"editable"`
}

type Document struct {
	ID          string                   `json:"id"`
	Kind        string                   `json:"kind"`
	Title       string                   `json:"title"`
	ClaimAmount string                   `json:"claimAmount,omitempty"`
	Sections    []DocSection             `json:"sections"`
	PlainText   string                   `json:"plainText"`
	Version     int                      `json:"version"`
	Status      string                   `json:"status"` // generating|draft|final
	IssueIDs    []string                 `json:"issueIds"`
	Destination string                   `json:"destination"` // forum
	Validation  *legal.ValidationResult  `json:"validation,omitempty"`
}

type Readiness struct {
	DocumentsReady      int      `json:"documentsReady"`
	DocumentsTotal      int      `json:"documentsTotal"`
	BlockingAdvisoryIDs []string `json:"blockingAdvisoryIds"`
	CanExport           bool     `json:"canExport"`
}

type StatusEvent struct {
	Step  string `json:"step"`
	Label string `json:"label"`
	At    string `json:"at"`
	Note  string `json:"note,omitempty"`
}

type Situation struct {
	ID            string          `json:"id"`
	Title         string          `json:"title"`
	Status        string          `json:"status"` // draft|intake|in_progress|validated|ready
	Locale        string          `json:"locale"`
	Currency      string          `json:"currency"`
	ClaimAmount   string          `json:"claimAmount,omitempty"`
	ActiveIssueID string          `json:"activeIssueId,omitempty"`
	CreatedAt     string          `json:"createdAt"`
	UpdatedAt     string          `json:"updatedAt"`
	Messages      []Message       `json:"messages"`
	Facts         []Fact          `json:"facts"`
	Issues        []Issue         `json:"issues"`
	Parties       []Party         `json:"parties"`
	Evidence      []Evidence      `json:"evidence"`
	Timeline      []TimelineEvent `json:"timeline"`
	Documents     []Document      `json:"documents"`
	Advisories    []Advisory      `json:"advisories"`
	Readiness     Readiness       `json:"readiness"`
	StatusHistory []StatusEvent   `json:"statusHistory,omitempty"`
}

// New returns an empty intake-stage situation with every slice initialised (so it
// always marshals valid arrays for the zod-validated client).
func New(id, locale, currency, createdAt string) *Situation {
	return &Situation{
		ID:         id,
		Title:      "Yangi holat",
		Status:     "intake",
		Locale:     locale,
		Currency:   currency,
		CreatedAt:  createdAt,
		UpdatedAt:  createdAt,
		Messages:   []Message{},
		Facts:      []Fact{},
		Issues:     []Issue{},
		Parties:    []Party{},
		Evidence:   []Evidence{},
		Timeline:   []TimelineEvent{},
		Documents:  []Document{},
		Advisories: []Advisory{},
		Readiness:  Readiness{BlockingAdvisoryIDs: []string{}},
	}
}

// UpsertFact replaces a fact with the same key or appends it.
func (s *Situation) UpsertFact(f Fact) {
	for i := range s.Facts {
		if s.Facts[i].Key == f.Key {
			s.Facts[i] = f
			return
		}
	}
	s.Facts = append(s.Facts, f)
}

// FindFact returns the value for a fact key (and whether it exists).
func (s *Situation) FindFact(key string) (string, bool) {
	for _, f := range s.Facts {
		if f.Key == key {
			return f.Value, true
		}
	}
	return "", false
}

// RecomputeReadiness derives the readiness block from documents + open advisories.
func (s *Situation) RecomputeReadiness() {
	ready := 0
	for _, d := range s.Documents {
		if d.Status == "final" {
			ready++
		}
	}
	blocking := []string{}
	for _, a := range s.Advisories {
		if a.Status == "open" && (a.Severity == "urgent" || a.Severity == "high") {
			blocking = append(blocking, a.ID)
		}
	}
	s.Readiness = Readiness{
		DocumentsReady:      ready,
		DocumentsTotal:      len(s.Documents),
		BlockingAdvisoryIDs: blocking,
		CanExport:           len(s.Documents) > 0 && ready == len(s.Documents) && len(blocking) == 0,
	}
}
