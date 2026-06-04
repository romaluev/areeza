package legal

// LegalRoute matches packages/core LegalRoute JSON.
type LegalRoute struct {
	Court             string   `json:"court"`
	ApplicationType   string   `json:"applicationType"`
	FeeNote           string   `json:"feeNote"`
	Limitation        string   `json:"limitation"`
	LegalBasis        []string `json:"legalBasis"`
	RequiredDocuments []string `json:"requiredDocuments"`
	Forum             string   `json:"forum,omitempty"`
	DocumentKind      string   `json:"documentKind,omitempty"`
}

var routesByCategory = map[string]LegalRoute{
	"labor.wage_recovery": {
		Court:           "Tuman (shahar) fuqarolik ishlari bo'yicha sudi",
		ApplicationType: "Da'vo arizasi",
		FeeNote:         "Davlat bojidan ozod — mehnat munosabatlaridan kelib chiqqan da'vo (MK 277 / SK 329). Boj javobgardan undiriladi.",
		Limitation:      "3 oy — ishchi huquqi buzilganini bilgan yoki bilishi kerak bo'lgan kundan boshlab.",
		LegalBasis: []string{
			"Mehnat kodeksi — ish haqini to'lash majburiyati (kamida yarim oyda bir marta)",
			"Fuqarolik protsessual kodeksi 188, 189, 191-moddalari",
		},
		RequiredDocuments: []string{
			"Mehnat shartnomasi nusxasi",
			"Ish haqi qarzi bo'yicha hisob-kitob",
			"O'rtacha ish haqi to'g'risida ma'lumotnoma",
			"Ishga qabul qilish to'g'risidagi buyruq nusxasi",
			"Da'vo arizasi nusxalari (javobgar soni bo'yicha — FPK 190)",
		},
	},
	"labor.reinstatement": {
		Court:             "Tuman (shahar) fuqarolik ishlari bo'yicha sudi",
		ApplicationType:   "Da'vo arizasi",
		FeeNote:           "Davlat bojidan ozod — mehnat munosabatlari.",
		Limitation:        "1 oy — ishdan bo'shatilgan kundan.",
		LegalBasis:        []string{"Mehnat kodeksi", "FPK 188–191"},
		RequiredDocuments: []string{"Mehnat shartnomasi", "Buyruq nusxasi", "Da'vo arizasi nusxalari"},
	},
	"debt.recovery": {
		Court:             "Qarzdor joylashgan fuqarolik sudi",
		ApplicationType:   "Da'vo arizasi yoki sud buyrug'i",
		FeeNote:           "Davlat boji — da'vo bahosiga qarab.",
		Limitation:        "Umumiy muddat qoidalari qo'llanadi.",
		LegalBasis:        []string{"Fuqarolik kodeksi", "FPK 173–174, 188–191"},
		RequiredDocuments: []string{"Qarz hujjati", "Hisob-kitob"},
	},
	"consumer.dispute": {
		Court:             "Javobgar yoki zarar joyi bo'yicha sud",
		ApplicationType:   "Da'vo arizasi",
		FeeNote:           "Davlat boji qoidalari.",
		Limitation:        "Iste'molchi huquqlari muddati.",
		LegalBasis:        []string{"Iste'molchilar huquqlarini himoya qilish to'g'risidagi qonun"},
		RequiredDocuments: []string{"Xarid hujjati", "Dalillar"},
	},
	"family.child_support": {
		Court:             "Tuman (shahar) fuqarolik sudi",
		ApplicationType:   "Sud buyrug'i yoki da'vo arizasi",
		FeeNote:           "Aliment da'volari — boj qoidalari.",
		Limitation:        "Aliment undirish muddati.",
		LegalBasis:        []string{"Oila kodeksi", "FPK 173–174, 188–191"},
		RequiredDocuments: []string{"Farzand tug'ilish to'g'risidagi guvohnoma"},
		Forum:             string(ForumFamilyCourt), DocumentKind: "court_order_petition",
	},
	"fraud.investment": {
		Court: "Tuman (shahar) fuqarolik ishlari bo'yicha sudi", ApplicationType: "Da'vo arizasi",
		FeeNote: "Davlat boji — da'vo bahosiga qarab.", Limitation: "Umumiy muddat [VERIFY]",
		LegalBasis: []string{"Fuqarolik kodeksi", "FPK 188–191"}, RequiredDocuments: []string{"Shartnoma", "To'lov dalillari"},
		Forum: string(ForumCivilCourt), DocumentKind: "davo_arizasi",
	},
	"criminal.fraud_complaint": {
		Court: "Prokuratura", ApplicationType: "Jinoiy ish bo'yicha ariza",
		FeeNote: "Davlat boji talab etilmaydi.", Limitation: "Jinoiy ish muddati [VERIFY]",
		LegalBasis: []string{"Jinoyat kodeksi — firibgarlik [VERIFY]"}, RequiredDocuments: []string{"Dalillar ro'yxati"},
		Forum: string(ForumProsecutor), DocumentKind: "prosecutor_complaint",
	},
	"criminal.corruption": {
		Court: "Korrupsiyaga qarshi kurashish agentligi", ApplicationType: "Korrupsiya haqida ariza",
		FeeNote: "—", Limitation: "[VERIFY]",
		LegalBasis: []string{"Korrupsiyaga qarshi kurashish to'g'risidagi qonun [VERIFY]"},
		RequiredDocuments: []string{"Dalillar"},
		Forum: string(ForumAnticorruptionAgency), DocumentKind: "admin_complaint",
	},
	"admin.police_inaction": {
		Court: "Prokuratura", ApplicationType: "Ma'muriy shikoyat",
		FeeNote: "—", Limitation: "[VERIFY]",
		LegalBasis: []string{"Prokuratura nizomi [VERIFY]"},
		RequiredDocuments: []string{"Murojaat nusxalari"},
		Forum: string(ForumProsecutor), DocumentKind: "admin_complaint",
	},
	"labor.harassment": {
		Court: "Prokuratura / mehnat inspeksiyasi", ApplicationType: "Jinoiy yoki mehnat shikoyati",
		FeeNote: "—", Limitation: "3 oy [VERIFY]",
		LegalBasis: []string{"Mehnat kodeksi", "JK [VERIFY]"},
		RequiredDocuments: []string{"Dalillar"},
		Forum: string(ForumProsecutor), DocumentKind: "prosecutor_complaint",
	},
	"admin.labor_complaint": {
		Court: "Mehnat inspeksiyasi", ApplicationType: "Mehnat huquqlari buzilishi",
		FeeNote: "—", Limitation: "3 oy",
		LegalBasis: []string{"Mehnat kodeksi [VERIFY]"}, RequiredDocuments: []string{"Dalillar"},
		Forum: string(ForumLaborInspectorate), DocumentKind: "admin_complaint",
	},
	"family.alimony_enforcement": {
		Court: "Tuman (shahar) fuqarolik sudi", ApplicationType: "Sud buyrug'i / aliment",
		FeeNote: "Aliment — boj qoidalari [VERIFY]", Limitation: "Aliment muddati",
		LegalBasis: []string{"Oila kodeksi", "FPK 173–174 [VERIFY]"},
		RequiredDocuments: []string{"Sud qarori / nikoh guvohnomasi"},
		Forum: string(ForumFamilyCourt), DocumentKind: "court_order_petition",
	},
	"family.property_division": {
		Court: "Tuman (shahar) fuqarolik sudi", ApplicationType: "Da'vo arizasi",
		FeeNote: "Davlat boji [VERIFY]", Limitation: "Umumiy muddat [VERIFY]",
		LegalBasis: []string{"Oila kodeksi", "Fuqarolik kodeksi", "FPK 188–191"},
		RequiredDocuments: []string{"Nikoh guvohnomasi", "Mulk hujjatlari"},
		Forum: string(ForumCivilCourt), DocumentKind: "davo_arizasi",
	},
	"family.injunction": {
		Court: "Tuman (shahar) fuqarolik sudi", ApplicationType: "Ta'minlov choralari arizasi",
		FeeNote: "[VERIFY]", Limitation: "Shoshilinch — kechiktirmasdan",
		LegalBasis: []string{"FPK ta'minlov choralari [VERIFY]"},
		RequiredDocuments: []string{"Mulk hujjatlari", "Sotuv dalillari"},
		Forum: string(ForumCivilCourt), DocumentKind: "injunction_petition",
	},
}

func RouteForCategory(code string) LegalRoute {
	if r, ok := routesByCategory[code]; ok {
		return r
	}
	return LegalRoute{
		Court:             "Tuman (shahar) fuqarolik sudi",
		ApplicationType:   "Da'vo arizasi",
		FeeNote:           "Davlat boji qoidalari qo'llanadi.",
		Limitation:        "Muddat tekshiriladi.",
		LegalBasis:        []string{"FPK 188–191"},
		RequiredDocuments: []string{"Da'vo arizasi nusxalari"},
	}
}
