package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/romaluev/areeza/server/internal/ai/draft"
	"github.com/romaluev/areeza/server/internal/ai/intake"
	"github.com/romaluev/areeza/server/internal/ai/validate"
	"github.com/romaluev/areeza/server/internal/export"
	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/situation"
	"github.com/romaluev/areeza/server/internal/store"
	"github.com/romaluev/areeza/server/pkg/llm"
)

type Handler struct {
	Store      *store.Store
	Brain      *intake.Brain
	Classifier *legal.Classifier
	Drafter    *draft.Drafter
	Provider   *llm.Provider
}

var dateRE = regexp.MustCompile(`\d{4}-\d{2}-\d{2}`)

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
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
	var result legal.Classification
	if h.Classifier != nil {
		result = h.Classifier.Classify(r.Context(), req.Text)
	} else {
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
	SituationID string `json:"situationId"`
	CaseID      string `json:"caseId"`
}

func (b caseIDBody) id() string {
	if b.SituationID != "" {
		return b.SituationID
	}
	return b.CaseID
}

// primaryDocument returns the situation's main court filing (first davo_arizasi, else
// the first document).
func primaryDocument(s *situation.Situation) (situation.Document, bool) {
	for _, d := range s.Documents {
		if d.Kind == "davo_arizasi" {
			return d, true
		}
	}
	if len(s.Documents) > 0 {
		return s.Documents[0], true
	}
	return situation.Document{}, false
}

type validateBody struct {
	SituationID string `json:"situationId"`
	CaseID      string `json:"caseId"`
	DocumentID  string `json:"documentId"`
}

func (b validateBody) id() string {
	if b.SituationID != "" {
		return b.SituationID
	}
	return b.CaseID
}

// Validate runs the deterministic rule checks against the situation's real data, then
// escalates only the ambiguous body-adequacy item to one Claude soft-pass. The result
// is persisted onto the document (doc.validation) and the document is promoted to
// "final" when it can be filed (unlocking export readiness).
func (h *Handler) Validate(w http.ResponseWriter, r *http.Request) {
	var req validateBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	raw, ok := h.Store.Get(req.id())
	if !ok {
		http.NotFound(w, r)
		return
	}
	var s situation.Situation
	if json.Unmarshal(raw, &s) != nil || s.ID == "" {
		writeErr(w, http.StatusInternalServerError, "invalid situation")
		return
	}

	doc, docIdx := findDocument(&s, req.DocumentID)
	if doc == nil {
		http.NotFound(w, r)
		return
	}
	route, categoryCode := routeForDocument(&s, *doc)
	deadline, hasDeadline := situationDeadline(&s, categoryCode)

	hasPlaintiff, hasDefendant := false, false
	for _, p := range s.Parties {
		switch p.Role {
		case "plaintiff":
			hasPlaintiff = true
		case "defendant":
			hasDefendant = true
		}
	}
	pending := 0
	for _, e := range s.Evidence {
		if e.Status != "uploaded" && e.Status != "verified" {
			pending++
		}
	}

	result := legal.RunValidation(legal.ValidationInput{
		DocumentKind: doc.Kind,
		HasPlaintiff: hasPlaintiff,
		HasDefendant: hasDefendant,
		ClaimAmount:  orStr(doc.ClaimAmount, s.ClaimAmount),
		Court:        route.Court,
		FeeNote:      route.FeeNote,
		Limitation:   route.Limitation,
		RequiredDocs: len(route.RequiredDocuments),
		PendingDocs:  pending,
		Deadline:     deadline,
		HasDeadline:  hasDeadline,
		BodyFilled:   bodyFilled(*doc),
	})

	// Soft-pass: escalate the body-adequacy item only (deterministic-first).
	if h.Provider != nil {
		var ambiguous []legal.ValidationCheck
		for _, c := range result.Checks {
			if c.ID == "demand" {
				ambiguous = append(ambiguous, c)
			}
		}
		if refined, err := validate.SoftPass(r.Context(), h.Provider, doc.PlainText, ambiguous); err == nil {
			mergeChecks(&result, refined)
		}
	}

	doc.Validation = &result
	if result.CanFile {
		doc.Status = "final"
	}
	s.Documents[docIdx] = *doc
	s.Status = "validated"
	s.RecomputeReadiness()
	s.StatusHistory = append(s.StatusHistory, situation.StatusEvent{
		Step: "validate", Label: "Tekshiruv o'tkazildi", At: nowRFC(),
	})
	if out, err := json.Marshal(&s); err == nil {
		h.Store.Put(s.ID, out)
	}
	writeJSON(w, http.StatusOK, result)
}

// findDocument returns the situation document with id (and its index), or (nil, -1).
func findDocument(s *situation.Situation, docID string) (*situation.Document, int) {
	for i := range s.Documents {
		if s.Documents[i].ID == docID {
			d := s.Documents[i]
			return &d, i
		}
	}
	return nil, -1
}

// situationDeadline computes the limitation deadline from a trigger date in the facts.
func situationDeadline(s *situation.Situation, categoryCode string) (legal.DeadlineResult, bool) {
	trigger := ""
	for _, key := range []string{"last_payment_date", "dismissal_date", "incident_date", "contract_date", "violation_date"} {
		if v, ok := s.FindFact(key); ok {
			if d := dateRE.FindString(v); d != "" {
				trigger = d
				break
			}
		}
	}
	if trigger == "" {
		return legal.DeadlineResult{}, false
	}
	res := legal.ComputeDeadline(legal.LimitationRuleForCategory(categoryCode), trigger, time.Now().UTC())
	if res.DeadlineDate == "" {
		return legal.DeadlineResult{}, false
	}
	return res, true
}

func bodyFilled(doc situation.Document) bool {
	for _, sec := range doc.Sections {
		if sec.Kind == "body" && len(strings.TrimSpace(sec.Content)) > 60 {
			return true
		}
	}
	return false
}

// mergeChecks overlays soft-pass {id,status,fix} onto the deterministic result and
// recomputes CanFile (a soft "fail" blocks filing).
func mergeChecks(result *legal.ValidationResult, refined []legal.ValidationCheck) {
	for _, rc := range refined {
		for i := range result.Checks {
			if result.Checks[i].ID == rc.ID {
				result.Checks[i].Status = rc.Status
				if rc.Fix != "" {
					result.Checks[i].Fix = rc.Fix
				}
			}
		}
	}
	result.CanFile = true
	for _, c := range result.Checks {
		if c.Status == "fail" {
			result.CanFile = false
		}
	}
}

func nowRFC() string { return time.Now().UTC().Format(time.RFC3339) }

func (h *Handler) Export(w http.ResponseWriter, r *http.Request) {
	var req caseIDBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	id := req.id()
	writeJSON(w, http.StatusOK, map[string]string{
		"pdfUrl":      "/api/export/" + id + ".pdf",
		"packageName": "areeza-topshiriq-" + id + ".pdf",
	})
}

// ExportPDF server-renders the situation's primary court document to an A4 court-layout
// PDF via headless Chrome. Degrades to a minimal placeholder (not a 500) when Chrome is
// unavailable so the demo download never hard-fails.
func (h *Handler) ExportPDF(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "caseId")
	raw, ok := h.Store.Get(id)
	if !ok {
		http.NotFound(w, r)
		return
	}
	var s situation.Situation
	if json.Unmarshal(raw, &s) != nil || s.ID == "" {
		writeErr(w, http.StatusInternalServerError, "invalid situation")
		return
	}
	doc, ok := primaryDocument(&s)
	if !ok {
		writeErr(w, http.StatusNotFound, "no document on situation")
		return
	}
	html, err := export.RenderDocumentHTML(s, doc)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "render failed")
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `attachment; filename="areeza-`+id+`.pdf"`)

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	pdf, err := export.ChromeRenderer{}.ToPDF(ctx, html)
	if err != nil {
		log.Printf("export: chrome render failed (%v) — serving placeholder", err)
		_, _ = w.Write([]byte("%PDF-1.4\n% Areeza: PDF renderer (Chrome) unavailable on host\n"))
		return
	}
	_, _ = w.Write(pdf)
}

type updateDocBody struct {
	SituationID string          `json:"situationId"`
	CaseID      string          `json:"caseId"`
	Document    json.RawMessage `json:"document"`
}

func (b updateDocBody) id() string {
	if b.SituationID != "" {
		return b.SituationID
	}
	return b.CaseID
}

func (h *Handler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	var req updateDocBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	raw, ok := h.Store.Get(req.id())
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
	h.Store.Put(req.id(), updated)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(req.Document)
}

type regenBody struct {
	SituationID string  `json:"situationId"`
	CaseID      string  `json:"caseId"`
	DocumentID  string  `json:"documentId"`
	SectionID   string  `json:"sectionId"`
	Instruction *string `json:"instruction,omitempty"`
}

func (b regenBody) id() string {
	if b.SituationID != "" {
		return b.SituationID
	}
	return b.CaseID
}

// RegenerateSection re-runs opus on a SINGLE section per the user's instruction (the
// "recall the AI agents" revise path), reusing the cached legal block so revision is
// cheap. The new content replaces the section; the version is bumped and persisted.
func (h *Handler) RegenerateSection(w http.ResponseWriter, r *http.Request) {
	var req regenBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	if h.Drafter == nil {
		writeErr(w, http.StatusServiceUnavailable, "drafter unavailable")
		return
	}
	raw, ok := h.Store.Get(req.id())
	if !ok {
		http.NotFound(w, r)
		return
	}
	var s situation.Situation
	if json.Unmarshal(raw, &s) != nil || s.ID == "" {
		writeErr(w, http.StatusInternalServerError, "invalid situation")
		return
	}

	doc, docIdx := findDocument(&s, req.DocumentID)
	if doc == nil {
		http.NotFound(w, r)
		return
	}
	secIdx := -1
	for i := range doc.Sections {
		if doc.Sections[i].ID == req.SectionID {
			secIdx = i
			break
		}
	}
	if secIdx == -1 {
		writeErr(w, http.StatusNotFound, "section not found")
		return
	}

	route, categoryCode := routeForDocument(&s, *doc)
	articles, _ := legal.RetrieveArticles(categoryCode, factsQuery(s.Facts), 4)
	instruction := ""
	if req.Instruction != nil {
		instruction = *req.Instruction
	}

	filled, err := h.Drafter.RegenerateOne(r.Context(), draft.DraftInput{
		Kind:        doc.Kind,
		Skeleton:    doc.Sections,
		Route:       route,
		Articles:    articles,
		Facts:       s.Facts,
		Parties:     s.Parties,
		ClaimAmount: orStr(doc.ClaimAmount, s.ClaimAmount),
		Locale:      s.Locale,
	}, req.SectionID, doc.Sections[secIdx].Content, instruction)
	if err != nil {
		writeErr(w, http.StatusBadGateway, "regenerate: "+err.Error())
		return
	}

	doc.Sections[secIdx].Content = filled.Content
	var plain strings.Builder
	for _, sec := range doc.Sections {
		plain.WriteString(sec.Content + "\n\n")
	}
	doc.PlainText = strings.TrimSpace(plain.String())
	doc.Version++
	doc.Status = "draft"   // re-validate after an edit
	doc.Validation = nil
	s.Documents[docIdx] = *doc
	s.RecomputeReadiness()
	if out, err := json.Marshal(&s); err == nil {
		h.Store.Put(s.ID, out)
	}
	writeJSON(w, http.StatusOK, doc)
}

func (h *Handler) Draft(w http.ResponseWriter, r *http.Request) {
	var req caseIDBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "bad json")
		return
	}
	raw, ok := h.Store.Get(req.id())
	if !ok {
		http.NotFound(w, r)
		return
	}
	var s situation.Situation
	if json.Unmarshal(raw, &s) != nil {
		writeErr(w, http.StatusInternalServerError, "invalid situation")
		return
	}
	if doc, ok := primaryDocument(&s); ok {
		writeJSON(w, http.StatusOK, doc)
		return
	}
	writeErr(w, http.StatusNotFound, "no document on situation")
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
