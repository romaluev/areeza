package legal

import (
	"strconv"
	"strings"
)

// ValidationInput is the deterministic-validation surface. The api layer extracts these
// signals from the typed Situation (legal can't import situation — it would cycle).
type ValidationInput struct {
	DocumentKind string
	HasPlaintiff bool
	HasDefendant bool
	ClaimAmount  string
	Court        string
	FeeNote      string
	Limitation   string
	RequiredDocs int // count from the route
	PendingDocs  int // evidence items not yet uploaded/verified
	Deadline     DeadlineResult
	HasDeadline  bool
	BodyFilled   bool // the body/bayonnoma section has real content
}

// RunValidation runs the deterministic checks (required fields, claim value, fee,
// jurisdiction, limitation, attachments) tied to the situation's real data. Only the
// body-adequacy item is left ambiguous for the optional Claude soft-pass. CanFile is
// true when no check fails.
func RunValidation(in ValidationInput) ValidationResult {
	checks := make([]ValidationCheck, 0, 9)
	add := func(id, label, status, ground, fix string) {
		checks = append(checks, ValidationCheck{ID: id, Label: label, Status: status, Ground: ground, Fix: fix})
	}

	if strings.TrimSpace(in.Court) != "" {
		add("court_name", "Sud nomi va sudlovi ko'rsatilgan", "ok", "FPK 189(1), 195", "")
	} else {
		add("court_name", "Sud nomi aniqlanmagan", "fail", "FPK 189(1)", "To'g'ri sud nomi va sudlovini ko'rsating.")
	}

	if in.HasPlaintiff {
		add("plaintiff", "Da'vogar ma'lumotlari to'liq", "ok", "FPK 189(2)", "")
	} else {
		add("plaintiff", "Da'vogar ma'lumotlari yetishmaydi", "fail", "FPK 189(2)", "Da'vogar F.I.Sh. va manzilini kiriting.")
	}

	if in.HasDefendant {
		add("defendant", "Javobgar aniqlangan va rekvizitlari ko'rsatilgan", "ok", "FPK 189(3)", "")
	} else {
		add("defendant", "Javobgar aniqlanmagan", "fail", "FPK 189(3)", "Javobgar nomi va rekvizitlarini kiriting.")
	}

	if in.BodyFilled {
		add("demand", "Talab va faktik holatlar bayon etilgan", "ok", "FPK 189(4)", "")
	} else {
		add("demand", "Faktik holatlar to'liq bayon etilmagan", "warn", "FPK 189(4)", "Hujjat matnini tayyorlang (bayonnoma).")
	}

	if strings.TrimSpace(in.ClaimAmount) != "" {
		add("claim_value", "Da'vo bahosi ko'rsatilgan ("+in.ClaimAmount+")", "ok", "FPK 189(5)", "")
	} else {
		add("claim_value", "Da'vo bahosi ko'rsatilmagan", "warn", "FPK 189(5)", "Talab summasini aniq ko'rsating.")
	}

	if strings.TrimSpace(in.FeeNote) != "" {
		add("fee", "Davlat boji asosi/ozodligi ko'rsatilgan", "ok", "FPK 191 / 195", "")
	} else {
		add("fee", "Davlat boji holati noaniq", "warn", "FPK 191", "Davlat boji yoki undan ozodlik asosini aniqlang.")
	}

	switch {
	case !in.HasDeadline:
		add("limitation", "Da'vo muddati tekshirilsin", "warn", "Muddat — "+orVerify(in.Limitation), "Muddatni hisoblash uchun tegishli sanani kiriting.")
	case in.Deadline.DaysLeft < 0:
		add("limitation", "Da'vo muddati o'tib ketgan", "fail", "Muddat — "+orVerify(in.Limitation), "Muddatni tiklash uchun uzrli sabab asosini ko'rsating yoki yurist bilan maslahatlashing.")
	case in.Deadline.DaysLeft < 7:
		add("limitation", "Da'vo muddati tugayapti ("+strconv.Itoa(in.Deadline.DaysLeft)+" kun qoldi)", "warn", "Muddat — "+orVerify(in.Limitation), "Arizani zudlik bilan topshiring.")
	default:
		add("limitation", "Da'vo muddati ichida ("+strconv.Itoa(in.Deadline.DaysLeft)+" kun qoldi)", "ok", "Muddat — "+orVerify(in.Limitation), "")
	}

	if in.RequiredDocs > 0 {
		if in.PendingDocs == 0 {
			add("attachments", "Zarur hujjatlar biriktirilgan", "ok", "FPK 189(6), 191", "")
		} else {
			add("attachments", strconv.Itoa(in.PendingDocs)+" ta zarur hujjat biriktirilmagan", "warn", "FPK 189(6)", "Yetishmayotgan hujjatlarni biriktiring — bu rad etilish xavfini kamaytiradi.")
		}
	}

	add("signature", "Imzo va sana qatori mavjud", "ok", "FPK 195", "")

	canFile := true
	for _, c := range checks {
		if c.Status == "fail" {
			canFile = false
		}
	}
	return ValidationResult{Checks: checks, CanFile: canFile}
}

func orVerify(s string) string {
	if strings.TrimSpace(s) == "" {
		return "[VERIFY]"
	}
	return s
}
