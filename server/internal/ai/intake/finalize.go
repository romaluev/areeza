package intake

import (
	"context"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/legal/templates"
	"github.com/romaluev/areeza/server/internal/situation"
)

var dateRE = regexp.MustCompile(`\d{4}-\d{2}-\d{2}`)

// proposeSources runs classify + RAG grounding, then PAUSES: it streams the retrieved
// lex.uz articles to the chat and stashes a pending gate, waiting for the user to
// confirm before any document is assembled. The confirm turn is caught in RunTurn,
// which calls confirmAndFinalize. (CLAUDE.md: human-in-the-loop, navigation not advice.)
func (b *Brain) proposeSources(ctx context.Context, st Store, workingID string, working *situation.Situation, in finalizeInput, emit func(Event)) error {
	query := strings.TrimSpace(in.Summary)
	if query == "" {
		query = factSummary(working)
	}

	cls := b.classify(ctx, query)
	emit(Event{"type": "classified", "classification": cls})

	articles, ragOK := legal.RetrieveArticles(cls.CategoryCode, query, 4)
	if articles == nil {
		articles = []legal.Article{}
	}

	prompt := "Holatingiz uchun tegishli qonun asoslari tayyorlandi. Hujjat tayyorlashni boshlaymizmi?"
	if ragOK && len(articles) > 0 {
		prompt = "Quyidagi qonun moddalari ariza uchun huquqiy asos qilib olinadi. Tasdiqlaysizmi?"
	}
	emit(Event{"type": "sources_proposed", "articles": articles, "prompt": prompt})
	emit(Event{"type": "awaiting_confirmation", "kind": "sources"})

	// Stash classify + RAG so the confirm turn doesn't recompute, then mirror the prompt
	// into the conversation so the next turn's server-side context stays coherent.
	savePending(st, workingID, &pendingDraft{
		Finalize: in, Class: cls, Articles: articles, RagOK: ragOK, Query: query,
	})
	msg := prompt + "\n\nTasdiqlash uchun \"Tasdiqlayman\" tugmasini bosing, yoki o'zgartirish kerak bo'lsa yozib qoldiring."
	emit(Event{"type": "assistant_delta", "delta": msg})
	working.Messages = append(working.Messages, situation.Message{
		ID:        newID("m-"),
		Role:      "assistant",
		Content:   msg,
		CreatedAt: nowRFC(),
	})
	save(st, workingID, working)
	return nil
}

// confirmAndFinalize runs after the user confirms the proposed sources: route (enriched
// with the confirmed articles) → assemble the rich Situation (issue, parties, evidence,
// timeline, advisories, document, readiness) → persist under a fresh id → reset the
// draft slot → emit "done". The authoritative output is the persisted aggregate.
func (b *Brain) confirmAndFinalize(ctx context.Context, st Store, workingID string, working *situation.Situation, p *pendingDraft, emit func(Event)) error {
	_ = ctx
	cls := p.Class
	articles := p.Articles
	ragOK := p.RagOK
	in := p.Finalize

	// Route, enriched with the confirmed RAG citations.
	route := legal.RouteForCategory(cls.CategoryCode)
	if ragOK && len(articles) > 0 {
		cites := make([]string, 0, len(articles))
		for _, a := range articles {
			cites = append(cites, legal.CitationLine(a))
		}
		route.LegalBasis = append(cites, route.LegalBasis...)
	}

	// Assemble the final aggregate.
	final := situation.New(newID("situation-"), working.Locale, working.Currency, working.CreatedAt)
	final.Title = orDefault(in.Title, "Yangi holat")
	final.Status = "in_progress"
	final.ClaimAmount = in.ClaimAmount
	final.Messages = working.Messages
	final.Facts = working.Facts

	issue := situation.Issue{
		ID:             "issue-1",
		CategoryCode:   cls.CategoryCode,
		Title:          final.Title,
		Severity:       in.Severity,
		Rationale:      orDefault(cls.TrackRationale, in.Summary),
		Classification: &cls,
		Route:          &route,
		Step:           "prepare",
		Status:         "routed",
		Position:       f64ptr(1),
	}
	final.Issues = append(final.Issues, issue)
	final.ActiveIssueID = issue.ID
	emit(Event{"type": "issue_identified", "issue": issue})
	emit(Event{"type": "route_proposed", "issueId": issue.ID, "route": route})
	emit(Event{"type": "active_issue", "issueId": issue.ID})

	// 5. Parties (plaintiff = applicant; defendant = employer/opponent if known).
	for _, p := range buildParties(working, issue.ID) {
		final.Parties = append(final.Parties, p)
		emit(Event{"type": "party_added", "party": p})
	}

	// 6. Evidence from required documents.
	for i, doc := range route.RequiredDocuments {
		ev := situation.Evidence{
			ID:          newID("ev-"),
			Kind:        evidenceKind(doc),
			Title:       doc,
			Status:      "pending",
			IssueIDs:    []string{issue.ID},
			DocumentIDs: []string{},
		}
		final.Evidence = append(final.Evidence, ev)
		if i < 6 {
			emit(Event{"type": "evidence_logged", "evidence": ev})
		}
	}

	// 7. Timeline from date facts + computed limitation deadline.
	now := time.Now().UTC()
	for _, f := range working.Facts {
		if d := dateRE.FindString(f.Value); d != "" {
			te := situation.TimelineEvent{
				ID:       newID("tl-"),
				Date:     d,
				Label:    f.Label,
				Kind:     "fact",
				IssueIDs: []string{issue.ID},
			}
			final.Timeline = append(final.Timeline, te)
			emit(Event{"type": "timeline_event", "event": te})
		}
	}
	deadline, hasDeadline := computeDeadline(working, cls.CategoryCode, now)
	if hasDeadline {
		te := situation.TimelineEvent{
			ID:       newID("tl-"),
			Date:     deadline.DeadlineDate,
			Label:    "Da'vo muddati: " + deadline.Label,
			Kind:     "deadline",
			IssueIDs: []string{issue.ID},
		}
		final.Timeline = append(final.Timeline, te)
		emit(Event{"type": "timeline_event", "event": te})
	}

	// 8. Advisories (deadline, evidence gap, mandatory human review, RAG compliance).
	for _, adv := range buildAdvisories(final, issue.ID, deadline, hasDeadline, articles, ragOK) {
		final.Advisories = append(final.Advisories, adv)
		emit(Event{"type": "advisory", "advisory": adv})
	}

	// 9. Document skeleton (slot-fill happens in the separate draft step).
	doc := buildDocument(route, issue.ID, final.ClaimAmount)
	final.Documents = append(final.Documents, doc)
	emit(Event{"type": "document_proposed", "document": doc})

	final.RecomputeReadiness()
	final.StatusHistory = []situation.StatusEvent{
		{Step: "classify", Label: "Kategoriya aniqlandi", At: nowRFC()},
		{Step: "route", Label: "Marshrut tayyorlandi", At: nowRFC()},
		{Step: "prepare", Label: "Hujjat taklif qilindi", At: nowRFC()},
	}

	emit(Event{"type": "next_action", "action": map[string]any{
		"label": "Ishlar panelini ko'rish", "action": "open_issues",
	}})

	// 10. Persist final, reset the draft slot, signal done.
	save(st, final.ID, final)
	save(st, workingID, situation.New(workingID, working.Locale, "UZS", nowRFC()))
	emit(Event{"type": "done", "situationId": final.ID})
	return nil
}

func buildParties(working *situation.Situation, issueID string) []situation.Party {
	var parties []situation.Party

	applicant := firstFact(working, "applicant_name", "plaintiff_name", "full_name")
	plaintiff := situation.Party{
		ID:         newID("pt-"),
		Role:       "plaintiff",
		Kind:       "person",
		Name:       orDefault(applicant, "Da'vogar (siz)"),
		Requisites: map[string]string{},
		IssueIDs:   []string{issueID},
	}
	if addr := firstFact(working, "applicant_address", "plaintiff_address"); addr != "" {
		plaintiff.Requisites["manzil"] = addr
	}
	parties = append(parties, plaintiff)

	defName := firstFact(working, "employer_name", "defendant_name", "company_name", "debtor_name")
	if defName != "" {
		kind := "person"
		if firstFact(working, "employer_name", "company_name") != "" {
			kind = "organization"
		}
		def := situation.Party{
			ID:         newID("pt-"),
			Role:       "defendant",
			Kind:       kind,
			Name:       defName,
			Requisites: map[string]string{},
			IssueIDs:   []string{issueID},
		}
		if addr := firstFact(working, "employer_address", "defendant_address"); addr != "" {
			def.Requisites["manzil"] = addr
		}
		if stir := firstFact(working, "employer_stir", "stir", "inn"); stir != "" {
			def.Requisites["STIR"] = stir
		}
		parties = append(parties, def)
	}
	return parties
}

func buildAdvisories(s *situation.Situation, issueID string, dl legal.DeadlineResult, hasDeadline bool, articles []legal.Article, ragOK bool) []situation.Advisory {
	var out []situation.Advisory

	if hasDeadline && dl.Severity != "info" && dl.Severity != "" {
		out = append(out, situation.Advisory{
			ID:          newID("adv-"),
			Kind:        "deadline_warning",
			Severity:    dl.Severity,
			Title:       "Da'vo muddatiga e'tibor bering",
			Body:        "Hisob-kitobga ko'ra muddat " + dl.Label + ". Arizani o'z vaqtida topshiring (" + itoa(dl.DaysLeft) + " kun qoldi).",
			Status:      "open",
			IssueIDs:    []string{issueID},
			DocumentIDs: []string{},
		})
	}

	pending := 0
	for _, e := range s.Evidence {
		if e.Status == "pending" {
			pending++
		}
	}
	if pending > 0 {
		out = append(out, situation.Advisory{
			ID:          newID("adv-"),
			Kind:        "evidence_gap",
			Severity:    "medium",
			Title:       "Zarur hujjatlarni to'plang",
			Body:        "Ariza uchun " + itoa(pending) + " ta hujjat hali biriktirilmagan. Ularni tayyorlash arizaning rad etilish xavfini kamaytiradi.",
			Status:      "open",
			IssueIDs:    []string{issueID},
			DocumentIDs: []string{},
		})
	}

	out = append(out, situation.Advisory{
		ID:          newID("adv-"),
		Kind:        "human_review_required",
		Severity:    "info",
		Title:       "Inson nazorati tavsiya etiladi",
		Body:        "Areeza yuridik maslahat bermaydi — hujjatni topshirishdan oldin malakali yurist yoki yuridik klinika ko'rigidan o'tkazing.",
		Status:      "open",
		IssueIDs:    []string{issueID},
		DocumentIDs: []string{},
	})

	if ragOK && len(articles) > 0 {
		var b strings.Builder
		b.WriteString("Holatingiz quyidagi qonun hujjatlariga asoslanadi:\n")
		for i, a := range articles {
			if i >= 3 {
				break
			}
			b.WriteString("• " + legal.CitationLine(a) + "\n")
		}
		out = append(out, situation.Advisory{
			ID:          newID("adv-"),
			Kind:        "compliance_note",
			Severity:    "info",
			Title:       "Qonuniy asos (lex.uz)",
			Body:        strings.TrimSpace(b.String()),
			Status:      "open",
			IssueIDs:    []string{issueID},
			DocumentIDs: []string{},
		})
	}
	return out
}

func buildDocument(route legal.LegalRoute, issueID, claimAmount string) situation.Document {
	tmpl := templates.ForKind(route.DocumentKind)
	sections := make([]situation.DocSection, 0, len(tmpl.Sections))
	var plain strings.Builder
	for _, sec := range tmpl.Sections {
		sections = append(sections, situation.DocSection{
			ID:       sec.ID,
			Kind:     sec.Kind,
			Content:  sec.Template,
			Editable: sec.Editable,
		})
		plain.WriteString(sec.Template + "\n\n")
	}
	dest := route.Forum
	if dest == "" {
		dest = "civil_court"
	}
	return situation.Document{
		ID:          newID("doc-"),
		Kind:        tmpl.Kind,
		Title:       tmpl.TitleUz,
		ClaimAmount: claimAmount,
		Sections:    sections,
		PlainText:   strings.TrimSpace(plain.String()),
		Version:     1,
		Status:      "draft",
		IssueIDs:    []string{issueID},
		Destination: dest,
	}
}

func computeDeadline(working *situation.Situation, categoryCode string, now time.Time) (legal.DeadlineResult, bool) {
	trigger := ""
	for _, key := range []string{"last_payment_date", "dismissal_date", "incident_date", "contract_date", "violation_date"} {
		if v := firstFact(working, key); v != "" {
			if d := dateRE.FindString(v); d != "" {
				trigger = d
				break
			}
		}
	}
	if trigger == "" {
		return legal.DeadlineResult{}, false
	}
	rule := legal.LimitationRuleForCategory(categoryCode)
	res := legal.ComputeDeadline(rule, trigger, now)
	if res.DeadlineDate == "" {
		return legal.DeadlineResult{}, false
	}
	return res, true
}

// --- small helpers ---

func factSummary(s *situation.Situation) string {
	var parts []string
	for _, f := range s.Facts {
		parts = append(parts, f.Label+": "+f.Value)
	}
	return strings.Join(parts, "; ")
}

func firstFact(s *situation.Situation, keys ...string) string {
	for _, k := range keys {
		if v, ok := s.FindFact(k); ok && strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func evidenceKind(doc string) string {
	d := strings.ToLower(doc)
	switch {
	case strings.Contains(d, "shartnoma"):
		return "contract"
	case strings.Contains(d, "hisob") || strings.Contains(d, "kvitan") || strings.Contains(d, "to'lov"):
		return "receipt"
	case strings.Contains(d, "ma'lumotnoma") || strings.Contains(d, "buyruq") || strings.Contains(d, "guvohnoma") || strings.Contains(d, "qaror"):
		return "official_record"
	default:
		return "other"
	}
}

func orDefault(v, def string) string {
	if strings.TrimSpace(v) == "" {
		return def
	}
	return v
}

func f64ptr(v float64) *float64 { return &v }

func itoa(n int) string {
	if n < 0 {
		n = 0
	}
	return strconv.Itoa(n)
}
