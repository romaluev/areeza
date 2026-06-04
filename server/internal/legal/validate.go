package legal

// ValidationResult matches packages/core validation contract.
type ValidationResult struct {
	Checks  []ValidationCheck `json:"checks"`
	CanFile bool              `json:"canFile"`
}

type ValidationCheck struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Status string `json:"status"`
	Ground string `json:"ground"`
	Fix    string `json:"fix"`
}

// ValidateForDocumentKind returns deterministic checks per template kind.
func ValidateForDocumentKind(kind string) ValidationResult {
	switch kind {
	case "prosecutor_complaint", "admin_complaint":
		return ValidationResult{
			CanFile: true,
			Checks: []ValidationCheck{
				{ID: "applicant", Label: "Ariza beruvchi ma'lumotlari", Status: "ok", Ground: "[VERIFY]"},
				{ID: "facts", Label: "Voqea tavsifi bayon etilgan", Status: "ok", Ground: "[VERIFY]"},
				{ID: "signature", Label: "Imzo va sana", Status: "ok", Ground: "[VERIFY]"},
			},
		}
	case "injunction_petition":
		return ValidationResult{
			CanFile: false,
			Checks: []ValidationCheck{
				{ID: "urgency", Label: "Shoshilinchlik asoslangan", Status: "ok", Ground: "FPK ta'minlov [VERIFY]"},
				{ID: "property", Label: "Mulk hujjatlari ilova qilingan", Status: "warn", Ground: "[VERIFY]", Fix: "Kadastr yoki mulk hujjatini ilova qiling."},
			},
		}
	default:
		return DefaultWageValidation()
	}
}

// DefaultWageValidation is the demo checklist (deterministic; soft-pass later).
func DefaultWageValidation() ValidationResult {
	return ValidationResult{
		CanFile: false,
		Checks: []ValidationCheck{
			{ID: "court_name", Label: "Sud nomi va sudlovi to'g'ri ko'rsatilgan", Status: "ok", Ground: "FPK 189(1), 195"},
			{ID: "plaintiff", Label: "Da'vogar ma'lumotlari to'liq", Status: "ok", Ground: "FPK 189(2)"},
			{ID: "defendant", Label: "Javobgar aniqlangan va rekvizitlari ko'rsatilgan", Status: "ok", Ground: "FPK 189(3)"},
			{ID: "demand", Label: "Talab aniq bayon etilgan", Status: "ok", Ground: "FPK 189(4)"},
			{ID: "claim_value", Label: "Da'vo bahosi ko'rsatilgan (8 400 000 so'm)", Status: "ok", Ground: "FPK 189(5)"},
			{ID: "fee", Label: "Davlat boji ozodligi asosi ko'rsatilgan", Status: "ok", Ground: "FPK 191 / 195"},
			{ID: "limitation", Label: "Da'vo 3 oylik muddat ichida", Status: "ok", Ground: "Mehnat nizosi muddati"},
			{
				ID: "contract", Label: "Mehnat shartnomasi nusxasi ilova qilingan", Status: "warn",
				Ground: "FPK 189(6), 191",
				Fix:  "Mehnat shartnomasi nusxasini ilova qiling — bu mehnat munosabati faktini tasdiqlaydi.",
			},
			{
				ID: "salary_certificate", Label: "O'rtacha ish haqi to'g'risida ma'lumotnoma ilova qilingan", Status: "warn",
				Ground: "FPK 189(6)",
				Fix:  "Ish beruvchidan o'rtacha ish haqi to'g'risida ma'lumotnoma oling va ilova qiling.",
			},
			{ID: "copies", Label: "Javobgar soni bo'yicha nusxalar tayyorlangan", Status: "ok", Ground: "FPK 190"},
			{ID: "signature", Label: "Ariza imzolangan va sana qo'yilgan", Status: "ok", Ground: "FPK 195"},
		},
	}
}
