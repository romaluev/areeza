import type { CategoryCode, LegalRoute, ValidationCheck } from "../types/index";

export type CategoryMeta = {
  code: CategoryCode;
  labelUz: string;
  labelRu: string;
  trigger: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    code: "labor.wage_recovery",
    labelUz: "Mehnat nizosi — ish haqini undirish",
    labelRu: "Трудовой спор — взыскание заработной платы",
    trigger: "oyligimni to'lamayapti",
  },
  {
    code: "labor.reinstatement",
    labelUz: "Mehnat nizosi — ishga qaytarish",
    labelRu: "Трудовой спор — восстановление на работе",
    trigger: "ishdan bo'shatishdi",
  },
  {
    code: "debt.recovery",
    labelUz: "Qarzni undirish",
    labelRu: "Взыскание долга",
    trigger: "qarz qaytarmayapti",
  },
  {
    code: "consumer.dispute",
    labelUz: "Iste'molchi nizosi",
    labelRu: "Потребительский спор",
    trigger: "sifatsiz tovar",
  },
  {
    code: "family.child_support",
    labelUz: "Aliment",
    labelRu: "Алименты",
    trigger: "aliment to'lamayapti",
  },
  {
    code: "other",
    labelUz: "Boshqa",
    labelRu: "Другое",
    trigger: "",
  },
];

export const WAGE_RECOVERY_ROUTE: LegalRoute = {
  court: "Tuman (shahar) fuqarolik ishlari bo'yicha sudi",
  applicationType: "Da'vo arizasi",
  feeNote:
    "Davlat bojidan ozod — mehnat munosabatlaridan kelib chiqqan da'vo (MK 277 / SK 329). Boj javobgardan undiriladi.",
  limitation:
    "3 oy — ishchi huquqi buzilganini bilgan yoki bilishi kerak bo'lgan kundan boshlab.",
  legalBasis: [
    "Mehnat kodeksi — ish haqini to'lash majburiyati (kamida yarim oyda bir marta)",
    "Fuqarolik protsessual kodeksi 188, 189, 191-moddalari",
  ],
  requiredDocuments: [
    "Mehnat shartnomasi nusxasi",
    "Ish haqi qarzi bo'yicha hisob-kitob",
    "O'rtacha ish haqi to'g'risida ma'lumotnoma",
    "Ishga qabul qilish to'g'risidagi buyruq nusxasi",
    "Da'vo arizasi nusxalari (javobgar soni bo'yicha — FPK 190)",
  ],
};

export const ROUTES_BY_CATEGORY: Partial<Record<CategoryCode, LegalRoute>> = {
  "labor.wage_recovery": WAGE_RECOVERY_ROUTE,
  "labor.reinstatement": {
    court: "Tuman (shahar) fuqarolik ishlari bo'yicha sudi",
    applicationType: "Da'vo arizasi",
    feeNote: "Davlat bojidan ozod — mehnat munosabatlari.",
    limitation: "1 oy — ishdan bo'shatilgan kundan.",
    legalBasis: ["Mehnat kodeksi", "FPK 188–191"],
    requiredDocuments: ["Mehnat shartnomasi", "Buyruq nusxasi", "Da'vo arizasi nusxalari"],
  },
  "debt.recovery": {
    court: "Qarzdor joylashgan fuqarolik sudi",
    applicationType: "Da'vo arizasi yoki sud buyrug'i",
    feeNote: "Davlat boji — da'vo bahosiga qarab.",
    limitation: "Umumiy muddat qoidalari qo'llanadi.",
    legalBasis: ["Fuqarolik kodeksi", "FPK 173–174, 188–191"],
    requiredDocuments: ["Qarz hujjati", "Hisob-kitob"],
  },
  "consumer.dispute": {
    court: "Javobgar yoki zarar joyi bo'yicha sud",
    applicationType: "Da'vo arizasi",
    feeNote: "Davlat boji qoidalari.",
    limitation: "Iste'molchi huquqlari muddati.",
    legalBasis: ["Iste'molchilar huquqlarini himoya qilish to'g'risidagi qonun"],
    requiredDocuments: ["Xarid hujjati", "Dalillar"],
  },
  "family.child_support": {
    court: "Tuman (shahar) fuqarolik sudi",
    applicationType: "Sud buyrug'i yoki da'vo arizasi",
    feeNote: "Aliment da'volari — boj qoidalari.",
    limitation: "Aliment undirish muddati.",
    legalBasis: ["Oila kodeksi", "FPK 173–174, 188–191"],
    requiredDocuments: ["Farzand tug'ilish to'g'risidagi guvohnoma"],
  },
};

export const WAGE_VALIDATION_RULES: Omit<ValidationCheck, "status" | "fix">[] = [
  { id: "court_name", label: "Sud nomi va sudlovi to'g'ri ko'rsatilgan", ground: "FPK 189(1), 195" },
  { id: "plaintiff", label: "Da'vogar ma'lumotlari to'liq (F.I.Sh., manzil, aloqa)", ground: "FPK 189(2)" },
  { id: "defendant", label: "Javobgar aniqlangan va rekvizitlari ko'rsatilgan", ground: "FPK 189(3)" },
  { id: "demand", label: "Talab aniq bayon etilgan", ground: "FPK 189(4)" },
  { id: "claim_value", label: "Da'vo bahosi ko'rsatilgan", ground: "FPK 189(5)" },
  { id: "fee", label: "Davlat boji bo'yicha ozodlik asosi ko'rsatilgan", ground: "FPK 191 / 195" },
  { id: "limitation", label: "Da'vo muddati ichida berilmoqda", ground: "Mehnat nizosi muddati" },
  { id: "contract", label: "Mehnat shartnomasi nusxasi ilova qilingan", ground: "FPK 189(6), 191" },
  { id: "salary_certificate", label: "O'rtacha ish haqi to'g'risida ma'lumotnoma ilova qilingan", ground: "FPK 189(6)" },
  { id: "copies", label: "Javobgar soni bo'yicha nusxalar tayyorlangan", ground: "FPK 190" },
  { id: "signature", label: "Ariza imzolangan va sana qo'yilgan", ground: "FPK 195" },
];

export function getRouteForCategory(code: CategoryCode): LegalRoute | undefined {
  return ROUTES_BY_CATEGORY[code];
}

export function getCategoryLabel(code: CategoryCode, locale: "uz" | "ru" = "uz"): string {
  const cat = CATEGORIES.find((c) => c.code === code);
  if (!cat) return code;
  return locale === "ru" ? cat.labelRu : cat.labelUz;
}
