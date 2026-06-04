package templates

// Section skeleton for document generation (structure only — slots filled by brain).
type SectionSkeleton struct {
	ID       string `json:"id"`
	Kind     string `json:"kind"`
	Template string `json:"template"`
	Editable bool   `json:"editable"`
}

type DocumentTemplate struct {
	Kind     string            `json:"kind"`
	TitleUz  string            `json:"titleUz"`
	Sections []SectionSkeleton `json:"sections"`
}

var DavoArizasi = DocumentTemplate{
	Kind: "davo_arizasi", TitleUz: "Da'vo arizasi",
	Sections: []SectionSkeleton{
		{ID: "court", Kind: "header", Template: "________ tuman (shahar) fuqarolik ishlari bo'yicha sudiga", Editable: false},
		{ID: "plaintiff", Kind: "party", Template: "Da'vogar: F.I.Sh., manzil, telefon", Editable: true},
		{ID: "defendant", Kind: "party", Template: "Javobgar: nomi, manzil, STIR", Editable: true},
		{ID: "title", Kind: "title", Template: "DA'VO ARIZASI", Editable: false},
		{ID: "body", Kind: "body", Template: "Faktik holatlar...", Editable: true},
		{ID: "demand", Kind: "demand", Template: "SO'RAYMAN:", Editable: true},
		{ID: "attachments", Kind: "attachments", Template: "Ilova:", Editable: true},
		{ID: "footer", Kind: "footer", Template: "Sana: ___  Imzo: ___", Editable: false},
	},
}

var ProsecutorComplaint = DocumentTemplate{
	Kind: "prosecutor_complaint", TitleUz: "Jinoiy ish bo'yicha ariza (prokuraturaga)",
	Sections: []SectionSkeleton{
		{ID: "header", Kind: "header", Template: "________ viloyat prokuraturasiga", Editable: false},
		{ID: "applicant", Kind: "party", Template: "Ariza beruvchi: F.I.Sh., manzil", Editable: true},
		{ID: "title", Kind: "title", Template: "ARIZA (jinoyat haqida xabar berish)", Editable: false},
		{ID: "body", Kind: "body", Template: "Voqea tavsifi... [VERIFY JK moddalari]", Editable: true},
		{ID: "demand", Kind: "demand", Template: "SO'RAYMAN: tekshirish o'tkazilsin", Editable: true},
		{ID: "attachments", Kind: "attachments", Template: "Ilova:", Editable: true},
		{ID: "footer", Kind: "footer", Template: "Sana: ___  Imzo: ___", Editable: false},
	},
}

var AdminComplaint = DocumentTemplate{
	Kind: "admin_complaint", TitleUz: "Ma'muriy shikoyat",
	Sections: []SectionSkeleton{
		{ID: "header", Kind: "header", Template: "________ organiga / prokuraturaga", Editable: false},
		{ID: "applicant", Kind: "party", Template: "Murojaat qiluvchi: F.I.Sh.", Editable: true},
		{ID: "body", Kind: "body", Template: "Ma'muriy harakat (yoki harakatsizlik)... [VERIFY]", Editable: true},
		{ID: "demand", Kind: "demand", Template: "SO'RAYMAN:", Editable: true},
		{ID: "footer", Kind: "footer", Template: "Sana: ___  Imzo: ___", Editable: false},
	},
}

var CourtOrderPetition = DocumentTemplate{
	Kind: "court_order_petition", TitleUz: "Sud buyrug'i uchun ariza",
	Sections: []SectionSkeleton{
		{ID: "court", Kind: "header", Template: "________ sudiga", Editable: false},
		{ID: "parties", Kind: "party", Template: "Tomonlar", Editable: true},
		{ID: "title", Kind: "title", Template: "SUD BUYRUG'I UCHUN ARIZA", Editable: false},
		{ID: "body", Kind: "body", Template: "FPK 173–174 [VERIFY]", Editable: true},
		{ID: "footer", Kind: "footer", Template: "Sana: ___  Imzo: ___", Editable: false},
	},
}

var InjunctionPetition = DocumentTemplate{
	Kind: "injunction_petition", TitleUz: "Ta'minlov choralari to'g'risidagi ariza",
	Sections: []SectionSkeleton{
		{ID: "court", Kind: "header", Template: "________ sudiga", Editable: false},
		{ID: "body", Kind: "body", Template: "Shoshilinch ta'minlov: mulk sotilishining oldini olish [VERIFY FPK]", Editable: true},
		{ID: "demand", Kind: "demand", Template: "SO'RAYMAN: taqiq qo'yilsin", Editable: true},
		{ID: "footer", Kind: "footer", Template: "Sana: ___  Imzo: ___", Editable: false},
	},
}

func ForKind(kind string) DocumentTemplate {
	switch kind {
	case "prosecutor_complaint":
		return ProsecutorComplaint
	case "admin_complaint":
		return AdminComplaint
	case "court_order_petition":
		return CourtOrderPetition
	case "injunction_petition":
		return InjunctionPetition
	default:
		return DavoArizasi
	}
}
