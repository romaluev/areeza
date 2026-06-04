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
