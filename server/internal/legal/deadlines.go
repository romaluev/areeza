package legal

import "time"

type LimitationRule string

const (
	LimitationReinstatement LimitationRule = "reinstatement_1mo"
	LimitationLabor         LimitationRule = "labor_3mo"
	LimitationMaterialDamage LimitationRule = "material_1yr"
	LimitationGeneral       LimitationRule = "general"
)

type DeadlineResult struct {
	DeadlineDate string `json:"deadlineDate"`
	DaysLeft     int    `json:"daysLeft"`
	Severity     string `json:"severity"` // urgent | high | medium | info
	Label        string `json:"label"`
}

func ComputeDeadline(rule LimitationRule, triggerDate string, now time.Time) DeadlineResult {
	trigger, err := time.Parse("2006-01-02", triggerDate)
	if err != nil {
		return DeadlineResult{Severity: "info", Label: "Muddat aniqlanmadi — sana tekshirilsin [VERIFY]"}
	}
	var months int
	switch rule {
	case LimitationReinstatement:
		months = 1
	case LimitationLabor:
		months = 3
	case LimitationMaterialDamage:
		months = 12
	default:
		months = 36
	}
	deadline := trigger.AddDate(0, months, 0)
	daysLeft := int(deadline.Sub(now).Hours() / 24)
	severity := "info"
	if daysLeft < 7 {
		severity = "urgent"
	} else if daysLeft < 30 {
		severity = "high"
	} else if daysLeft < 90 {
		severity = "medium"
	}
	return DeadlineResult{
		DeadlineDate: deadline.Format("2006-01-02"),
		DaysLeft:     daysLeft,
		Severity:     severity,
		Label:        deadline.Format("02.01.2006") + " gacha [VERIFY moddalar]",
	}
}

func LimitationRuleForCategory(code string) LimitationRule {
	switch code {
	case "labor.reinstatement":
		return LimitationReinstatement
	case "labor.wage_recovery", "labor.harassment", "admin.labor_complaint":
		return LimitationLabor
	default:
		return LimitationGeneral
	}
}
