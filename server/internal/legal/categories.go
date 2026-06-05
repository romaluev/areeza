package legal

import "strings"

// CategoryCodes is the canonical enum, mirroring packages/core categoryCodeSchema.
// It is the single source of truth shared by every classifier engine (the on-device
// tiers and the Claude-enum backup) so they all emit an identical Classification.
var CategoryCodes = []string{
	"labor.wage_recovery",
	"labor.reinstatement",
	"labor.harassment",
	"debt.recovery",
	"consumer.dispute",
	"family.child_support",
	"family.alimony_enforcement",
	"family.property_division",
	"family.injunction",
	"fraud.investment",
	"fraud.general",
	"criminal.fraud_complaint",
	"criminal.corruption",
	"admin.police_inaction",
	"admin.labor_complaint",
	"other",
}

// categoryLabelsUz maps each canonical code to its short Uzbek label.
var categoryLabelsUz = map[string]string{
	"labor.wage_recovery":        "Mehnat nizosi — ish haqini undirish",
	"labor.reinstatement":        "Mehnat nizosi — ishga qaytarish",
	"labor.harassment":           "Mehnat joyida bezorilik",
	"debt.recovery":              "Qarzni undirish",
	"consumer.dispute":           "Iste'molchi nizosi",
	"family.child_support":       "Oila nizosi — aliment",
	"family.alimony_enforcement": "Oila — aliment undirish",
	"family.property_division":   "Oila — mulkni bo'lish",
	"family.injunction":          "Ta'minlov choralari (shoshilinch)",
	"fraud.investment":           "Firibgarlik — investitsiya",
	"fraud.general":              "Firibgarlik",
	"criminal.fraud_complaint":   "Jinoiy firibgarlik shikoyati",
	"criminal.corruption":        "Korrupsiya",
	"admin.police_inaction":      "Ma'muriy — harakatsizlik shikoyati",
	"admin.labor_complaint":      "Mehnat huquqlari buzilishi (inspeksiya)",
	"other":                      "Boshqa turdagi nizo",
}

// orderTrackCategories default to the court-order (нizosiz) track unless an engine
// says otherwise.
var orderTrackCategories = map[string]bool{
	"family.child_support":       true,
	"family.alimony_enforcement": true,
}

// LabelForCategory returns the canonical Uzbek label for a code ("" → other).
func LabelForCategory(code string) string {
	if l, ok := categoryLabelsUz[code]; ok {
		return l
	}
	return categoryLabelsUz["other"]
}

// Compose builds a full Classification from a raw (code, confidence, track, rationale)
// produced by any classifier engine, filling Label + TrackLabel from the canonical
// tables. Unknown codes collapse to "other". It does NOT set ConfidenceLevel — the
// chain applies withLevel on its chosen result.
func Compose(categoryCode string, confidence float64, track, rationale string) Classification {
	code := categoryCode
	if _, ok := categoryLabelsUz[code]; !ok {
		code = "other"
	}

	switch strings.TrimSpace(track) {
	case "court_order", "order":
		track = "court_order"
	case "claim":
		track = "claim"
	default:
		if orderTrackCategories[code] {
			track = "court_order"
		} else {
			track = "claim"
		}
	}

	trackLabel := "Da'vo tartibi (nizoli)"
	if track == "court_order" {
		trackLabel = "Sud buyrug'i tartibi (nizosiz)"
	}

	if strings.TrimSpace(rationale) == "" {
		if track == "court_order" {
			rationale = "Hisoblangan va nizosiz talab — sud buyrug'i tartibida (FPK 170–178) yuritiladi."
		} else {
			rationale = "Summa yoki holatlar nizoli — da'vo tartibida (FPK 188–191) yuritiladi."
		}
	}

	return Classification{
		CategoryCode:   code,
		Label:          LabelForCategory(code),
		Confidence:     confidence,
		Track:          track,
		TrackLabel:     trackLabel,
		TrackRationale: rationale,
	}
}
