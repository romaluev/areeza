// Package seed builds the flagship demo Situation as a typed aggregate so the
// real-mode home list and workspace render a fully-populated example out of the
// box (the in-memory case seed.json is the older lean "case" shape). Dynamically
// created intake situations sit alongside this one.
package seed

import (
	"github.com/romaluev/areeza/server/internal/legal"
	"github.com/romaluev/areeza/server/internal/situation"
)

// DemoWageSituation is the unpaid-salary labor claim (CLAUDE.md flagship demo).
func DemoWageSituation() *situation.Situation {
	const id = "situation-demo-wage"
	created := "2026-05-20T09:00:00Z"

	cls := legal.ClassifyText("ish haqi to'lanmadi oylik")
	route := legal.RouteForCategory(cls.CategoryCode)

	issue := situation.Issue{
		ID:             "issue-wage",
		CategoryCode:   cls.CategoryCode,
		Title:          "Ish haqini undirish",
		Severity:       "high",
		Rationale:      cls.TrackRationale,
		Classification: &cls,
		Route:          &route,
		Step:           "prepare",
		Status:         "routed",
		Position:       f64(1),
	}

	doc := situation.Document{
		ID:          "doc-wage",
		Kind:        "davo_arizasi",
		Title:       "Da'vo arizasi — ish haqini undirish",
		ClaimAmount: "8 400 000",
		Sections: []situation.DocSection{
			{ID: "court", Kind: "header", Content: "Yakkasaroy tumani fuqarolik ishlari bo'yicha sudiga", Editable: false},
			{ID: "plaintiff", Kind: "party", Content: "Da'vogar: Akmal Karimov, Toshkent sh.", Editable: true},
			{ID: "defendant", Kind: "party", Content: "Javobgar: \"Oqtepa Logistics\" MChJ", Editable: true},
			{ID: "title", Kind: "title", Content: "DA'VO ARIZASI", Editable: false},
			{ID: "body", Kind: "body", Content: "2026-yil aprel–may oylari uchun ish haqi to'lanmagan.", Editable: true},
			{ID: "demand", Kind: "demand", Content: "SO'RAYMAN: 8 400 000 so'm ish haqi qarzini undirilsin.", Editable: true},
			{ID: "footer", Kind: "footer", Content: "Sana: ___  Imzo: ___", Editable: false},
		},
		PlainText:   "DA'VO ARIZASI\nIsh haqini undirish to'g'risida.",
		Version:     1,
		Status:      "draft",
		IssueIDs:    []string{issue.ID},
		Destination: "civil_court",
	}

	s := situation.New(id, "uz", "UZS", created)
	s.Title = "Ish haqini undirish — \"Oqtepa Logistics\""
	s.Status = "in_progress"
	s.ClaimAmount = "8 400 000"
	s.ActiveIssueID = issue.ID
	s.Messages = []situation.Message{
		{ID: "m1", Role: "user", Content: "Ish beruvchim 2 oydan beri oyligimni to'lamayapti.", CreatedAt: created},
		{ID: "m2", Role: "assistant", Content: "Tushundim — ish haqi to'lanmagan holat. Ish beruvchingiz nomi va manzilini ayta olasizmi?", CreatedAt: created},
	}
	s.Facts = []situation.Fact{
		{Key: "employer_name", Label: "Ish beruvchi", Value: "\"Oqtepa Logistics\" MChJ", Status: "collected", Group: "javobgar"},
		{Key: "employer_address", Label: "Javobgar manzili", Value: "Toshkent sh., Yakkasaroy tumani, Shota Rustaveli ko'chasi, 78-uy", Status: "collected", Group: "javobgar"},
		{Key: "salary_amount", Label: "Oylik ish haqi", Value: "4 200 000 so'm", Status: "collected"},
		{Key: "unpaid_period", Label: "To'lanmagan oylar", Value: "Aprel–may 2026 (2 oy)", Status: "collected"},
		{Key: "debt_total", Label: "Jami qarz", Value: "8 400 000 so'm", Status: "collected", Group: "talab"},
		{Key: "last_payment_date", Label: "Oxirgi to'lov sanasi", Value: "2026-03-31", Status: "collected"},
	}
	s.Issues = []situation.Issue{issue}
	s.Parties = []situation.Party{
		{ID: "pt-1", Role: "plaintiff", Kind: "person", Name: "Akmal Karimov", Requisites: map[string]string{"manzil": "Toshkent sh."}, IssueIDs: []string{issue.ID}},
		{ID: "pt-2", Role: "defendant", Kind: "organization", Name: "\"Oqtepa Logistics\" MChJ", Requisites: map[string]string{"manzil": "Toshkent sh., Yakkasaroy t."}, IssueIDs: []string{issue.ID}},
	}
	s.Evidence = []situation.Evidence{
		{ID: "ev-1", Kind: "contract", Title: "Mehnat shartnomasi nusxasi", Status: "uploaded", IssueIDs: []string{issue.ID}, DocumentIDs: []string{doc.ID}},
		{ID: "ev-2", Kind: "official_record", Title: "Ish haqi qarzi bo'yicha hisob-kitob", Status: "pending", IssueIDs: []string{issue.ID}, DocumentIDs: []string{}},
		{ID: "ev-3", Kind: "official_record", Title: "O'rtacha ish haqi to'g'risida ma'lumotnoma", Status: "pending", IssueIDs: []string{issue.ID}, DocumentIDs: []string{}},
	}
	s.Timeline = []situation.TimelineEvent{
		{ID: "tl-1", Date: "2026-03-31", Label: "Oxirgi ish haqi to'lovi", Kind: "fact", IssueIDs: []string{issue.ID}},
		{ID: "tl-2", Date: "2026-06-30", Label: "Da'vo muddati (taxminiy)", Kind: "deadline", IssueIDs: []string{issue.ID}},
	}
	s.Advisories = []situation.Advisory{
		{ID: "adv-1", Kind: "deadline_warning", Severity: "high", Title: "Da'vo muddatiga e'tibor bering", Body: "Mehnat nizolari uchun muddat — huquq buzilganini bilgandan 3 oy. Arizani o'z vaqtida topshiring.", Status: "open", IssueIDs: []string{issue.ID}, DocumentIDs: []string{}},
		{ID: "adv-2", Kind: "evidence_gap", Severity: "medium", Title: "Zarur hujjatlarni to'plang", Body: "Hisob-kitob va ma'lumotnoma hali biriktirilmagan.", Status: "open", IssueIDs: []string{issue.ID}, DocumentIDs: []string{}},
		{ID: "adv-3", Kind: "human_review_required", Severity: "info", Title: "Inson nazorati tavsiya etiladi", Body: "Areeza yuridik maslahat bermaydi — topshirishdan oldin yurist ko'rigidan o'tkazing.", Status: "open", IssueIDs: []string{issue.ID}, DocumentIDs: []string{}},
	}
	s.Documents = []situation.Document{doc}
	s.StatusHistory = []situation.StatusEvent{
		{Step: "classify", Label: "Kategoriya aniqlandi", At: created},
		{Step: "route", Label: "Marshrut tayyorlandi", At: created},
		{Step: "prepare", Label: "Hujjat tayyorlandi", At: created},
	}
	s.RecomputeReadiness()
	return s
}

func f64(v float64) *float64 { return &v }
