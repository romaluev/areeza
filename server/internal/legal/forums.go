package legal

// Forum matches packages/core forumSchema.
type Forum string

const (
	ForumCivilCourt           Forum = "civil_court"
	ForumProsecutor           Forum = "prosecutor"
	ForumAnticorruptionAgency Forum = "anticorruption_agency"
	ForumLaborInspectorate    Forum = "labor_inspectorate"
	ForumAdminAuthority       Forum = "admin_authority"
	ForumFamilyCourt          Forum = "family_court"
)

type ForumMeta struct {
	Code              Forum  `json:"code"`
	NameUz            string `json:"nameUz"`
	NameRu            string `json:"nameRu"`
	SubmissionChannel string `json:"submissionChannel"`
	SubmissionGuide   string `json:"submissionGuide"`
}

var forumsByCode = map[Forum]ForumMeta{
	ForumCivilCourt: {
		Code: ForumCivilCourt, NameUz: "Fuqarolik sudi", NameRu: "Гражданский суд",
		SubmissionChannel: "my.sud.uz / cabinet.sud.uz",
		SubmissionGuide:   "Da'vo arizasini my.sud.uz orqali yoki cabinet.sud.uz kabinetida elektron topshiring. [VERIFY] joriy talablar.",
	},
	ForumProsecutor: {
		Code: ForumProsecutor, NameUz: "Prokuratura", NameRu: "Прокуратура",
		SubmissionChannel: "prokuratura.uz / shaxsiy qabul",
		SubmissionGuide:   "Jinoiy shikoyatni prokuraturaga yoki viloyat prokuraturasiga topshiring. [VERIFY]",
	},
	ForumAnticorruptionAgency: {
		Code: ForumAnticorruptionAgency, NameUz: "Korrupsiyaga qarshi kurashish agentligi", NameRu: "Агентство по борьбе с коррупцией",
		SubmissionChannel: "anticorruption.uz",
		SubmissionGuide:   "Korrupsiya haqidagi murojaatni agentlik portali orqali yuboring. [VERIFY]",
	},
	ForumLaborInspectorate: {
		Code: ForumLaborInspectorate, NameUz: "Mehnat inspeksiyasi", NameRu: "Инспекция труда",
		SubmissionChannel: "mehnat.uz / hududiy inspeksiya",
		SubmissionGuide:   "Mehnat huquqlari buzilishi bo'yicha inspeksiyaga ariza bering. [VERIFY]",
	},
	ForumAdminAuthority: {
		Code: ForumAdminAuthority, NameUz: "Ma'muriy organ", NameRu: "Административный орган",
		SubmissionChannel: "prokuratura.uz / tegishli organ",
		SubmissionGuide:   "Ma'muriy shikoyatni tegishli organ yoki prokuraturaga topshiring. [VERIFY]",
	},
	ForumFamilyCourt: {
		Code: ForumFamilyCourt, NameUz: "Oila sudi / fuqarolik sudi", NameRu: "Семейный/гражданский суд",
		SubmissionChannel: "my.sud.uz",
		SubmissionGuide:   "Oila nizolari bo'yicha arizani sud portali orqali topshiring. [VERIFY]",
	},
}

func ForumMetaFor(code Forum) ForumMeta {
	if m, ok := forumsByCode[code]; ok {
		return m
	}
	return forumsByCode[ForumCivilCourt]
}
