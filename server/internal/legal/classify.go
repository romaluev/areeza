package legal

import (
	"regexp"
	"strings"
)

// Classification mirrors the TS contract (keyword router; Claude swap later).
type Classification struct {
	CategoryCode        string  `json:"categoryCode"`
	Label               string  `json:"label"`
	Confidence          float64 `json:"confidence"`
	ConfidenceLevel     string  `json:"confidenceLevel"`
	Track               string  `json:"track"`
	TrackLabel          string  `json:"trackLabel"`
	TrackRationale      string  `json:"trackRationale"`
	NeedsCategoryPick   *bool   `json:"needsCategoryPick,omitempty"`
	ClarifyingQuestion  *string `json:"clarifyingQuestion,omitempty"`
}

var gibberishRE = regexp.MustCompile(`^[\s\dA-Za-z]+$`)

func confidenceLevel(score float64) string {
	if score >= 0.8 {
		return "high"
	}
	if score >= 0.55 {
		return "medium"
	}
	return "low"
}

func withLevel(p Classification) Classification {
	p.ConfidenceLevel = confidenceLevel(p.Confidence)
	needs := p.ConfidenceLevel == "low" || p.CategoryCode == "other"
	if p.NeedsCategoryPick == nil {
		p.NeedsCategoryPick = &needs
	}
	return p
}

var demoWage = withLevel(Classification{
	CategoryCode:   "labor.wage_recovery",
	Label:          "Mehnat nizosi — ish haqini undirish",
	Confidence:     0.94,
	Track:          "claim",
	TrackLabel:     "Da'vo tartibi (nizoli)",
	TrackRationale: "Ish beruvchi to'lovni amalga oshirmagani va qarz nizoli bo'lgani sababli ish da'vo tartibida (FPK 188–191) yuritiladi — to'liq tinglash bilan.",
})

func ClassifyText(text string) Classification {
	normalized := strings.TrimSpace(strings.ToLower(text))

	if normalized == "" || len(normalized) < 4 {
		q := "Muammoingizni bir-ikki jumla bilan tushuntiring."
		return withLevel(Classification{
			CategoryCode: "other", Label: "Murojaat matni yetarli emas", Confidence: 0.2,
			Track: "claim", TrackLabel: "Aniqlanmadi", TrackRationale: "Qisqa yoki bo'sh matn — tasniflab bo'lmaydi.",
			ClarifyingQuestion: &q,
		})
	}

	// Keyword routing runs FIRST so real (often latin-only) Uzbek phrases are
	// matched before the gibberish guard. Stems cover possessive softening
	// (oylik → oyligi/oyligimni) and apostrophe-less typing.
	if strings.Contains(normalized, "oylik") || strings.Contains(normalized, "oylig") ||
		strings.Contains(normalized, "ish haq") || strings.Contains(normalized, "maosh") ||
		strings.Contains(normalized, "zarplat") || strings.Contains(normalized, "зарплат") {
		return demoWage
	}

	if strings.Contains(normalized, "ishdan") || strings.Contains(normalized, "bo'shat") ||
		strings.Contains(normalized, "boshat") || strings.Contains(normalized, "увол") {
		return withLevel(Classification{
			CategoryCode: "labor.reinstatement", Label: "Mehnat nizosi — ishga qaytarish", Confidence: 0.85,
			Track: "claim", TrackLabel: "Da'vo tartibi", TrackRationale: "Ishdan bo'shatish haqida.",
		})
	}

	if strings.Contains(normalized, "qarz") || strings.Contains(normalized, "долг") {
		return withLevel(Classification{
			CategoryCode: "debt.recovery", Label: "Qarzni undirish", Confidence: 0.78,
			Track: "claim", TrackLabel: "Da'vo tartibi", TrackRationale: "Qarz haqida.",
		})
	}

	if strings.Contains(normalized, "xizmat") || strings.Contains(normalized, "iste'mol") ||
		strings.Contains(normalized, "istemol") || strings.Contains(normalized, "remont") ||
		strings.Contains(normalized, "tovar") || strings.Contains(normalized, "mahsulot") {
		return withLevel(Classification{
			CategoryCode: "consumer.dispute", Label: "Iste'molchi nizosi", Confidence: 0.76,
			Track: "claim", TrackLabel: "Da'vo tartibi", TrackRationale: "Xizmat yoki mahsulot nizosi.",
		})
	}

	if strings.Contains(normalized, "aliment") || strings.Contains(normalized, "farzand") ||
		strings.Contains(normalized, "nafaqa") {
		return withLevel(Classification{
			CategoryCode: "family.child_support", Label: "Oila nizosi — aliment", Confidence: 0.88,
			Track: "court_order", TrackLabel: "Sud buyrug'i tartibi", TrackRationale: "Aliment bo'yicha.",
		})
	}

	// Only treat as gibberish if it's a short single token with no keyword match.
	if gibberishRE.MatchString(normalized) && len(normalized) < 30 && !strings.Contains(normalized, " ") {
		q := "Qaysi turdagi ish bo'yicha murojaat qilmoqchisiz?"
		return withLevel(Classification{
			CategoryCode: "other", Label: "Boshqa turdagi murojaat", Confidence: 0.25,
			Track: "claim", TrackLabel: "Aniqlanmadi", TrackRationale: "Matn tushunarli emas.",
			ClarifyingQuestion: &q,
		})
	}

	q := "Qaysi turdagi ish bo'yicha murojaat qilmoqchisiz?"
	return withLevel(Classification{
		CategoryCode: "other", Label: "Boshqa turdagi nizo", Confidence: 0.42,
		Track: "claim", TrackLabel: "Da'vo tartibi", TrackRationale: "Qo'shimcha ma'lumot kerak.",
		ClarifyingQuestion: &q,
	})
}
