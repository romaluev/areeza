import type {
  Case,
  CaseDetail,
  CaseFact,
  CaseMessage,
  Classification,
  GeneratedDocument,
  LegalRoute,
  StatusEvent,
  ValidationResult,
} from "../types/index";
import { sectionsToPlainText, withConfidenceLevel } from "../types/index";
import { ROUTES_BY_CATEGORY, WAGE_RECOVERY_ROUTE } from "../legal/index";

export const DEMO_PROMPT_UZ =
  "Ish beruvchim 2 oydan beri oyligimni to'lamayapti.";

export const DEMO_CASE_ID = "case-demo-wage";

const DAVO_PLAIN = `                    Chilonzor tuman fuqarolik ishlari bo'yicha sudiga

Da'vogar:   Rahimov Sardor Akmalovich
            Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi, 12-uy, 45-xonadon
            Tel: +998 90 123 45 67   ·   e-mail: s.rahimov@mail.uz

Javobgar:   "Oqtepa Logistics" MChJ
            Toshkent sh., Yakkasaroy tumani, Shota Rustaveli ko'chasi, 78-uy
            Hisob raqami: 2020 8000 1234 5678 9012   ·   STIR (INN): 305 612 489
            MFO: 00 491   ·   OKED: 52291   ·   Tel: +998 71 200 30 40


                              DA'VO ARIZASI
                       (ish haqini undirish to'g'risida)

                       Da'vo bahosi: 8 400 000 so'm


Men, Rahimov Sardor Akmalovich, 2023-yil 3-apreldan "Oqtepa Logistics" MChJ
da omborxona operatori lavozimida ishlayman (ishga qabul qilish to'g'risida
buyruq № 41-K, 03.04.2023). Oylik ish haqim — 4 200 000 so'm.

Ish beruvchi Mehnat kodeksi talablariga (ish haqini o'z vaqtida va kamida
yarim oyda bir marta to'lash majburiyati) zid ravishda 2026-yil aprel oyidan
2026-yil may oyigacha, ya'ni 2 oy davomida ish haqimni to'lamadi.
Jami qarz: 8 400 000 (sakkiz million to'rt yuz ming) so'm (hisob-kitob ilovada).

Ish haqini to'lashni so'rab ish beruvchiga og'zaki murojaat qildim, ammo
qarz bugungi kunga qadar to'lanmadi va nizo hal etilmadi.

Mehnat kodeksi hamda Fuqarolik protsessual kodeksining 188, 189, 191-
moddalariga asosan,

                              SO'RAYMAN:

Javobgar "Oqtepa Logistics" MChJ dan mening foydamga 8 400 000 (sakkiz million
to'rt yuz ming) so'm miqdoridagi ish haqi qarzini undirib berilishini so'rayman.

Eslatma: mazkur da'vo mehnat munosabatlaridan kelib chiqqani sababli davlat
bojidan ozod (MK 277 / SK 329). Davlat boji ish foydamga hal etilgan taqdirda
javobgardan undiriladi.

Ilova:
   1. Da'vo arizasining javobgar uchun nusxasi (FPK 190) — 1 nusxa
   2. Ish haqi qarzi bo'yicha hisob-kitob — 1 varaq
   3. Ishga qabul qilish to'g'risidagi buyruq nusxasi (№ 41-K) — 1 nusxa
   4. Mehnat shartnomasi nusxasi — ____ (ilova qilinishi lozim)
   5. O'rtacha ish haqi to'g'risida ma'lumotnoma — ____ (ilova qilinishi lozim)


Sana: 04.06.2026                              Imzo: __________ / S. A. Rahimov /`;

export const DEMO_CLASSIFICATION: Classification = withConfidenceLevel({
  categoryCode: "labor.wage_recovery",
  label: "Mehnat nizosi — ish haqini undirish",
  confidence: 0.94,
  track: "claim",
  trackLabel: "Da'vo tartibi (nizoli)",
  trackRationale:
    "Ish beruvchi to'lovni amalga oshirmagani va qarz nizoli bo'lgani sababli ish da'vo tartibida (FPK 188–191) yuritiladi — to'liq tinglash bilan.",
  needsCategoryPick: false,
});

export const DEMO_FACTS: CaseFact[] = [
  {
    key: "employer_name",
    label: "Ish beruvchi",
    value: '"Oqtepa Logistics" MChJ',
    status: "collected",
    group: "javobgar",
  },
  {
    key: "employer_address",
    label: "Javobgar manzili",
    value: "Toshkent sh., Yakkasaroy tumani, Shota Rustaveli ko'chasi, 78-uy",
    status: "collected",
    group: "javobgar",
  },
  {
    key: "employer_stir",
    label: "STIR (INN)",
    value: "305 612 489",
    status: "collected",
    group: "javobgar",
  },
  {
    key: "position",
    label: "Lavozim",
    value: "Omborxona operatori",
    status: "collected",
    group: "ish",
  },
  {
    key: "hire_date",
    label: "Ishga qabul sanasi",
    value: "2023-yil 3-aprel (buyruq № 41-K)",
    status: "collected",
    group: "ish",
  },
  {
    key: "salary_amount",
    label: "Oylik ish haqi",
    value: "4 200 000 so'm",
    status: "collected",
    group: "ish",
  },
  {
    key: "unpaid_months",
    label: "To'lanmagan oylar",
    value: "2026-yil aprel — may (2 oy)",
    status: "collected",
    group: "ish",
  },
  {
    key: "total_owed",
    label: "Jami qarz",
    value: "8 400 000 so'm",
    status: "collected",
    group: "ish",
  },
  {
    key: "contract",
    label: "Mehnat shartnomasi",
    value: "",
    status: "missing",
    group: "hujjatlar",
  },
  {
    key: "salary_certificate",
    label: "O'rtacha ish haqi ma'lumotnomasi",
    value: "",
    status: "missing",
    group: "hujjatlar",
  },
];

const DEMO_DAVO_SECTIONS: GeneratedDocument["sections"] = [
  {
    id: "court",
    kind: "header",
    content: "Chilonzor tuman fuqarolik ishlari bo'yicha sudiga",
    editable: false,
  },
  {
    id: "plaintiff",
    kind: "party",
    content:
      "Da'vogar: Rahimov Sardor Akmalovich\nToshkent sh., Chilonzor tumani, Bunyodkor ko'chasi, 12-uy, 45-xonadon\nTel: +998 90 123 45 67 · e-mail: s.rahimov@mail.uz",
    editable: true,
  },
  {
    id: "defendant",
    kind: "party",
    content:
      'Javobgar: "Oqtepa Logistics" MChJ\nToshkent sh., Yakkasaroy tumani, Shota Rustaveli ko\'chasi, 78-uy\nHisob raqami: 2020 8000 1234 5678 9012 · STIR: 305 612 489 · MFO: 00 491',
    editable: true,
  },
  {
    id: "title",
    kind: "title",
    content: "DA'VO ARIZASI\n(ish haqini undirish to'g'risida)\nDa'vo bahosi: 8 400 000 so'm",
    editable: false,
  },
  {
    id: "body",
    kind: "body",
    content:
      'Men, Rahimov Sardor Akmalovich, 2023-yil 3-apreldan "Oqtepa Logistics" MChJ da omborxona operatori lavozimida ishlayman. Ish beruvchi 2026-yil aprel va may oylarida ish haqimni to\'lamadi. Jami qarz: 8 400 000 so\'m.',
    editable: true,
  },
  {
    id: "demand",
    kind: "demand",
    content:
      "SO'RAYMAN:\nJavobgardan foydamga 8 400 000 so'm ish haqi qarzini undirib berilishini so'rayman.\nEslatma: mehnat munosabatlaridan kelib chiqqan da'vo davlat bojidan ozod.",
    editable: false,
  },
  {
    id: "attachments",
    kind: "attachments",
    content:
      "Ilova:\n1. Da'vo arizasi nusxasi (javobgar uchun)\n2. Ish haqi hisob-kitobi\n3. Ishga qabul buyrug'i\n4. Mehnat shartnomasi — ilova qilinishi lozim\n5. O'rtacha ish haqi ma'lumotnomasi — ilova qilinishi lozim",
    editable: true,
  },
  {
    id: "footer",
    kind: "footer",
    content: "Sana: 04.06.2026\nImzo: __________ / S. A. Rahimov /",
    editable: false,
  },
];

export const DEMO_DOCUMENT: GeneratedDocument = {
  id: "doc-demo-wage-1",
  kind: "davo_arizasi",
  title: "Da'vo arizasi — ish haqini undirish",
  claimAmount: "8 400 000 so'm",
  sections: DEMO_DAVO_SECTIONS,
  plainText: DAVO_PLAIN,
  version: 1,
  status: "final",
};

export const DEMO_DOCUMENT_CALCULATION: GeneratedDocument = {
  id: "doc-demo-wage-calc",
  kind: "calculation",
  title: "Ish haqi qarzi hisob-kitobi",
  sections: [
    {
      id: "calc-header",
      kind: "header",
      content: "Ish haqi qarzi bo'yicha hisob-kitob",
      editable: false,
    },
    {
      id: "calc-body",
      kind: "calculation",
      content:
        "Oylik ish haqi: 4 200 000 so'm\nTo'lanmagan davr: 2026-yil aprel, 2026-yil may (2 oy)\nJami: 4 200 000 × 2 = 8 400 000 so'm",
      editable: true,
    },
  ],
  plainText:
    "Ish haqi qarzi bo'yicha hisob-kitob\n\nOylik ish haqi: 4 200 000 so'm\nTo'lanmagan davr: aprel–may 2026 (2 oy)\nJami: 8 400 000 so'm",
  version: 1,
  status: "final",
};

export const DEMO_DOCUMENT_CHECKLIST: GeneratedDocument = {
  id: "doc-demo-wage-checklist",
  kind: "filing_checklist",
  title: "Topshirish ro'yxati",
  sections: [
    {
      id: "check-header",
      kind: "header",
      content: "Sudga topshirish uchun tekshiruv ro'yxati",
      editable: false,
    },
    {
      id: "check-items",
      kind: "checklist",
      content:
        "□ Da'vo arizasi (imzolangan)\n□ Javobgar uchun nusxa (FPK 190)\n□ Hisob-kitob\n□ Ishga qabul buyrug'i\n□ Mehnat shartnomasi — to'ldirish kerak\n□ O'rtacha ish haqi ma'lumotnomasi — to'ldirish kerak",
      editable: true,
    },
  ],
  plainText: sectionsToPlainText([
    {
      id: "check-header",
      kind: "header",
      content: "Sudga topshirish uchun tekshiruv ro'yxati",
      editable: false,
    },
    {
      id: "check-items",
      kind: "checklist",
      content:
        "□ Da'vo arizasi (imzolangan)\n□ Javobgar uchun nusxa\n□ Hisob-kitob\n□ Mehnat shartnomasi — to'ldirish kerak",
      editable: true,
    },
  ]),
  version: 1,
  status: "draft",
};

export const DEMO_DOCUMENTS: GeneratedDocument[] = [
  DEMO_DOCUMENT,
  DEMO_DOCUMENT_CALCULATION,
  DEMO_DOCUMENT_CHECKLIST,
];

export const DEMO_STATUS_HISTORY: StatusEvent[] = [
  { step: "describe", label: "Murojaat qabul qilindi", at: "2026-06-04T09:00:00Z" },
  {
    step: "classify",
    label: "Ish haqi nizosi aniqlandi",
    at: "2026-06-04T09:15:00Z",
    note: "Mehnat nizosi — ish haqini undirish",
  },
  { step: "route", label: "Marshrut tayyorlandi", at: "2026-06-04T10:00:00Z" },
  { step: "prepare", label: "Da'vo arizasi tayyorlandi", at: "2026-06-04T10:45:00Z" },
  {
    step: "validate",
    label: "Tekshiruv o'tkazildi",
    at: "2026-06-04T11:00:00Z",
    note: "2 ta ogohlantirish — ilovalar yetishmayapti",
  },
];

export const DEMO_VALIDATION: ValidationResult = {
  canFile: false,
  checks: [
    { id: "court_name", label: "Sud nomi va sudlovi to'g'ri ko'rsatilgan", status: "ok", ground: "FPK 189(1), 195", fix: "" },
    { id: "plaintiff", label: "Da'vogar ma'lumotlari to'liq", status: "ok", ground: "FPK 189(2)", fix: "" },
    { id: "defendant", label: "Javobgar aniqlangan va rekvizitlari ko'rsatilgan", status: "ok", ground: "FPK 189(3)", fix: "" },
    { id: "demand", label: "Talab aniq bayon etilgan", status: "ok", ground: "FPK 189(4)", fix: "" },
    { id: "claim_value", label: "Da'vo bahosi ko'rsatilgan (8 400 000 so'm)", status: "ok", ground: "FPK 189(5)", fix: "" },
    { id: "fee", label: "Davlat boji ozodligi asosi ko'rsatilgan", status: "ok", ground: "FPK 191 / 195", fix: "" },
    { id: "limitation", label: "Da'vo 3 oylik muddat ichida", status: "ok", ground: "Mehnat nizosi muddati", fix: "" },
    {
      id: "contract",
      label: "Mehnat shartnomasi nusxasi ilova qilingan",
      status: "warn",
      ground: "FPK 189(6), 191",
      fix: "Mehnat shartnomasi nusxasini ilova qiling — bu mehnat munosabati faktini tasdiqlaydi.",
    },
    {
      id: "salary_certificate",
      label: "O'rtacha ish haqi to'g'risida ma'lumotnoma ilova qilingan",
      status: "warn",
      ground: "FPK 189(6)",
      fix: "Ish beruvchidan o'rtacha ish haqi to'g'risida ma'lumotnoma oling va ilova qiling.",
    },
    { id: "copies", label: "Javobgar soni bo'yicha nusxalar tayyorlangan", status: "ok", ground: "FPK 190", fix: "" },
    { id: "signature", label: "Ariza imzolangan va sana qo'yilgan", status: "ok", ground: "FPK 195", fix: "" },
  ],
};

export const DEMO_MESSAGES: CaseMessage[] = [
  {
    id: "msg-1",
    role: "user",
    content: DEMO_PROMPT_UZ,
    createdAt: "2026-06-04T10:00:00Z",
  },
  {
    id: "msg-2",
    role: "assistant",
    content:
      "Tushundim — ish haqi to'lanmagan holat. Ish beruvchingizning nomi va manzilini ayta olasizmi?",
    createdAt: "2026-06-04T10:00:05Z",
  },
  {
    id: "msg-3",
    role: "user",
    content: '"Oqtepa Logistics" MChJ, Toshkent.',
    createdAt: "2026-06-04T10:01:00Z",
  },
  {
    id: "msg-4",
    role: "assistant",
    content:
      "Rahmat. Lavozimingiz va oylik ish haqingiz qancha? Qaysi oylardan beri to'lanmagan?",
    createdAt: "2026-06-04T10:01:05Z",
  },
];

export const DEMO_CASE_DETAIL: CaseDetail = {
  id: DEMO_CASE_ID,
  title: "Ish haqi — Oqtepa Logistics",
  status: "validated",
  step: "validate",
  categoryCode: "labor.wage_recovery",
  claimAmount: "8 400 000 so'm",
  currency: "UZS",
  createdAt: "2026-06-04T09:00:00Z",
  updatedAt: "2026-06-04T11:00:00Z",
  messages: DEMO_MESSAGES,
  facts: DEMO_FACTS,
  classification: DEMO_CLASSIFICATION,
  route: WAGE_RECOVERY_ROUTE,
  document: DEMO_DOCUMENT,
  documents: DEMO_DOCUMENTS,
  statusHistory: DEMO_STATUS_HISTORY,
  validation: DEMO_VALIDATION,
};

function statusHistory(
  events: Array<{ step: StatusEvent["step"]; label: string; at: string; note?: string }>,
): StatusEvent[] {
  return events;
}

const LOW_CONFIDENCE_CLASSIFICATION: Classification = withConfidenceLevel({
  categoryCode: "debt.recovery",
  label: "Qarzni undirish (aniqlanmagan)",
  confidence: 0.48,
  track: "claim",
  trackLabel: "Da'vo tartibi",
  trackRationale: "Matnda aniq kategoriya ajratilmadi — qo'shimcha savol kerak.",
  clarifyingQuestion: "Bu ish haqi, qarz yoki xizmat ko'rsatish nizosimi? Qisqacha tushuntiring.",
});

const OTHER_CLASSIFICATION: Classification = withConfidenceLevel({
  categoryCode: "other",
  label: "Boshqa turdagi murojaat",
  confidence: 0.35,
  track: "claim",
  trackLabel: "Aniqlanmadi",
  trackRationale: "Hozircha bu tur uchun to'liq hujjat tayyorlanmaydi.",
  clarifyingQuestion: "Qaysi turdagi ish bo'yicha murojaat qilmoqchisiz?",
});

export const CASE_LIST: Case[] = [
  {
    id: DEMO_CASE_ID,
    title: "Ish haqi — Oqtepa Logistics",
    status: "validated",
    step: "validate",
    categoryCode: "labor.wage_recovery",
    claimAmount: "8 400 000 so'm",
    currency: "UZS",
    createdAt: "2026-06-04T09:00:00Z",
    updatedAt: "2026-06-04T11:00:00Z",
  },
  {
    id: "case-reinstatement",
    title: "Ishga qaytarish — TexServis",
    status: "routed",
    step: "route",
    categoryCode: "labor.reinstatement",
    currency: "UZS",
    createdAt: "2026-06-03T14:00:00Z",
    updatedAt: "2026-06-03T16:00:00Z",
  },
  {
    id: "case-debt",
    title: "Qarz — Karimov B.",
    status: "classified",
    step: "classify",
    categoryCode: "debt.recovery",
    currency: "UZS",
    createdAt: "2026-06-02T08:00:00Z",
    updatedAt: "2026-06-02T10:00:00Z",
  },
  {
    id: "case-consumer",
    title: "Xizmat sifati — UyRemont",
    status: "drafted",
    step: "prepare",
    categoryCode: "consumer.dispute",
    claimAmount: "12 000 000 so'm",
    currency: "UZS",
    createdAt: "2026-06-01T11:00:00Z",
    updatedAt: "2026-06-01T15:00:00Z",
  },
  {
    id: "case-family",
    title: "Aliment — Mirzayev",
    status: "ready",
    step: "submit",
    categoryCode: "family.child_support",
    currency: "UZS",
    createdAt: "2026-05-28T09:00:00Z",
    updatedAt: "2026-05-30T12:00:00Z",
  },
  {
    id: "case-low-confidence",
    title: "Aniqlanmagan nizo",
    status: "classified",
    step: "classify",
    categoryCode: "debt.recovery",
    currency: "UZS",
    createdAt: "2026-06-04T08:00:00Z",
    updatedAt: "2026-06-04T08:30:00Z",
  },
  {
    id: "case-other",
    title: "Qo'lda tanlash kerak",
    status: "intake",
    step: "describe",
    categoryCode: "other",
    currency: "UZS",
    createdAt: "2026-06-04T07:00:00Z",
    updatedAt: "2026-06-04T07:10:00Z",
  },
  {
    id: "case-missing-facts",
    title: "Ma'lumot yetishmaydi — ish haqi",
    status: "routed",
    step: "route",
    categoryCode: "labor.wage_recovery",
    currency: "UZS",
    createdAt: "2026-06-03T09:00:00Z",
    updatedAt: "2026-06-03T10:00:00Z",
  },
  {
    id: "case-intake-new",
    title: "Yangi murojaat",
    status: "intake",
    step: "describe",
    currency: "UZS",
    createdAt: "2026-06-04T12:00:00Z",
    updatedAt: "2026-06-04T12:00:00Z",
  },
];

const CASE_DETAILS: Record<string, CaseDetail> = {
  [DEMO_CASE_ID]: DEMO_CASE_DETAIL,
  "case-reinstatement": {
    id: "case-reinstatement",
    title: "Ishga qaytarish — TexServis",
    status: "routed",
    step: "route",
    categoryCode: "labor.reinstatement",
    currency: "UZS",
    createdAt: "2026-06-03T14:00:00Z",
    updatedAt: "2026-06-03T16:00:00Z",
    messages: [
      {
        id: "r1",
        role: "user",
        content: "Meni ishdan asossiz ravishda bo'shatishdi.",
        createdAt: "2026-06-03T14:00:00Z",
      },
    ],
    facts: [
      {
        key: "employer",
        label: "Ish beruvchi",
        value: "TexServis MChJ",
        status: "collected",
      },
    ],
    classification: withConfidenceLevel({
      categoryCode: "labor.reinstatement",
      label: "Mehnat nizosi — ishga qaytarish",
      confidence: 0.88,
      track: "claim",
      trackLabel: "Da'vo tartibi",
      trackRationale: "Ishdan bo'shatish nizoli — to'liq da'vo tartibi.",
    }),
    route: ROUTES_BY_CATEGORY["labor.reinstatement"]!,
    statusHistory: statusHistory([
      { step: "describe", label: "Murojaat qabul qilindi", at: "2026-06-03T14:00:00Z" },
      { step: "classify", label: "Ishga qaytarish aniqlandi", at: "2026-06-03T15:00:00Z" },
      { step: "route", label: "Marshrut tayyorlandi", at: "2026-06-03T16:00:00Z" },
    ]),
  },
  "case-debt": {
    id: "case-debt",
    title: "Qarz — Karimov B.",
    status: "classified",
    step: "classify",
    categoryCode: "debt.recovery",
    currency: "UZS",
    createdAt: "2026-06-02T08:00:00Z",
    updatedAt: "2026-06-02T10:00:00Z",
    messages: [
      {
        id: "d1",
        role: "user",
        content: "Do'stimga pul qarz berdim, qaytarmayapti.",
        createdAt: "2026-06-02T08:00:00Z",
      },
    ],
    facts: [],
    classification: withConfidenceLevel({
      categoryCode: "debt.recovery",
      label: "Qarzni undirish",
      confidence: 0.82,
      track: "claim",
      trackLabel: "Da'vo tartibi",
      trackRationale: "Qarz miqdori nizoli.",
    }),
    statusHistory: statusHistory([
      { step: "describe", label: "Murojaat qabul qilindi", at: "2026-06-02T08:00:00Z" },
      { step: "classify", label: "Qarz nizosi", at: "2026-06-02T10:00:00Z" },
    ]),
  },
  "case-consumer": {
    id: "case-consumer",
    title: "Xizmat sifati — UyRemont",
    status: "drafted",
    step: "prepare",
    categoryCode: "consumer.dispute",
    claimAmount: "12 000 000 so'm",
    currency: "UZS",
    createdAt: "2026-06-01T11:00:00Z",
    updatedAt: "2026-06-01T15:00:00Z",
    messages: [
      {
        id: "c1",
        role: "user",
        content: "Uy remonti yomon qilindi, pul qaytarmayapti.",
        createdAt: "2026-06-01T11:00:00Z",
      },
    ],
    facts: [
      {
        key: "contractor",
        label: "Xizmat ko'rsatuvchi",
        value: "UyRemont MChJ",
        status: "collected",
      },
      {
        key: "amount",
        label: "To'langan summa",
        value: "12 000 000 so'm",
        status: "collected",
      },
    ],
    classification: withConfidenceLevel({
      categoryCode: "consumer.dispute",
      label: "Iste'molchi nizosi",
      confidence: 0.79,
      track: "claim",
      trackLabel: "Da'vo tartibi",
      trackRationale: "Xizmat sifati va pul qaytarish talabi nizoli.",
    }),
    route: ROUTES_BY_CATEGORY["consumer.dispute"]!,
    documents: [
      {
        id: "doc-consumer-1",
        kind: "davo_arizasi",
        title: "Da'vo arizasi — xizmat sifati",
        claimAmount: "12 000 000 so'm",
        sections: [
          {
            id: "title",
            kind: "title",
            content: "DA'VO ARIZASI\n(xizmat sifati to'g'risida)",
            editable: false,
          },
          {
            id: "body",
            kind: "body",
            content: "UyRemont MChJ tomonidan remont sifatsiz bajarildi.",
            editable: true,
          },
        ],
        plainText: "DA'VO ARIZASI\n(xizmat sifati)\n\nUyRemont MChJ tomonidan remont sifatsiz bajarildi.",
        version: 1,
        status: "draft",
      },
    ],
    document: undefined,
    statusHistory: statusHistory([
      { step: "describe", label: "Murojaat", at: "2026-06-01T11:00:00Z" },
      { step: "classify", label: "Iste'molchi nizosi", at: "2026-06-01T12:00:00Z" },
      { step: "route", label: "Marshrut", at: "2026-06-01T13:00:00Z" },
      { step: "prepare", label: "Qoralama tayyor", at: "2026-06-01T15:00:00Z" },
    ]),
  },
  "case-family": {
    id: "case-family",
    title: "Aliment — Mirzayev",
    status: "ready",
    step: "submit",
    categoryCode: "family.child_support",
    currency: "UZS",
    createdAt: "2026-05-28T09:00:00Z",
    updatedAt: "2026-05-30T12:00:00Z",
    messages: [
      {
        id: "f1",
        role: "user",
        content: "Turmush o'rtog'im aliment to'lamayapti.",
        createdAt: "2026-05-28T09:00:00Z",
      },
    ],
    facts: [
      {
        key: "child",
        label: "Farzand",
        value: "1 nafar voyaga yetmagan",
        status: "collected",
      },
    ],
    classification: withConfidenceLevel({
      categoryCode: "family.child_support",
      label: "Oila nizosi — aliment",
      confidence: 0.91,
      track: "court_order",
      trackLabel: "Sud buyrug'i tartibi",
      trackRationale: "Aliment — tezkor buyruq tartibi mumkin.",
    }),
    route: ROUTES_BY_CATEGORY["family.child_support"]!,
    documents: [
      {
        id: "doc-family-1",
        kind: "davo_arizasi",
        title: "Ariza — aliment",
        sections: [
          {
            id: "body",
            kind: "body",
            content: "Aliment to'lanmagan — 6 oy.",
            editable: true,
          },
        ],
        plainText: "Aliment to'lanmagan — 6 oy.",
        version: 2,
        status: "final",
      },
      {
        id: "doc-family-checklist",
        kind: "filing_checklist",
        title: "Topshirish ro'yxati",
        sections: [
          {
            id: "chk",
            kind: "checklist",
            content: "□ Ariza\n□ Nikoh guvohnomasi\n□ Tug'ilganlik haqida guvohnoma",
            editable: true,
          },
        ],
        plainText: "□ Ariza\n□ Nikoh guvohnomasi\n□ Tug'ilganlik haqida guvohnoma",
        version: 1,
        status: "final",
      },
    ],
    validation: {
      canFile: true,
      checks: [
        {
          id: "facts",
          label: "Asosiy faktlar to'liq",
          status: "ok",
          ground: "Oila kodeksi",
          fix: "",
        },
      ],
    },
    statusHistory: statusHistory([
      { step: "describe", label: "Murojaat", at: "2026-05-28T09:00:00Z" },
      { step: "classify", label: "Aliment", at: "2026-05-28T10:00:00Z" },
      { step: "prepare", label: "Hujjat tayyor", at: "2026-05-29T14:00:00Z" },
      { step: "validate", label: "Tekshiruv OK", at: "2026-05-30T11:00:00Z" },
      { step: "submit", label: "Yuklab olishga tayyor", at: "2026-05-30T12:00:00Z" },
    ]),
  },
  "case-low-confidence": {
    id: "case-low-confidence",
    title: "Aniqlanmagan nizo",
    status: "classified",
    step: "classify",
    categoryCode: "debt.recovery",
    currency: "UZS",
    createdAt: "2026-06-04T08:00:00Z",
    updatedAt: "2026-06-04T08:30:00Z",
    messages: [
      {
        id: "lc1",
        role: "user",
        content: "Menga pul berishmadi yoki ish bermadi, bilmayman.",
        createdAt: "2026-06-04T08:00:00Z",
      },
    ],
    facts: [],
    classification: LOW_CONFIDENCE_CLASSIFICATION,
    statusHistory: statusHistory([
      { step: "describe", label: "Murojaat", at: "2026-06-04T08:00:00Z" },
      {
        step: "classify",
        label: "Past ishonch — qo'shimcha savol",
        at: "2026-06-04T08:30:00Z",
        note: LOW_CONFIDENCE_CLASSIFICATION.clarifyingQuestion,
      },
    ]),
  },
  "case-other": {
    id: "case-other",
    title: "Qo'lda tanlash kerak",
    status: "intake",
    step: "describe",
    categoryCode: "other",
    currency: "UZS",
    createdAt: "2026-06-04T07:00:00Z",
    updatedAt: "2026-06-04T07:10:00Z",
    messages: [
      {
        id: "o1",
        role: "user",
        content: "asdfgh jkls qwerty 12345",
        createdAt: "2026-06-04T07:00:00Z",
      },
    ],
    facts: [],
    classification: OTHER_CLASSIFICATION,
    statusHistory: statusHistory([
      { step: "describe", label: "Murojaat (aniqlanmadi)", at: "2026-06-04T07:00:00Z" },
    ]),
  },
  "case-missing-facts": {
    id: "case-missing-facts",
    title: "Ma'lumot yetishmaydi — ish haqi",
    status: "routed",
    step: "route",
    categoryCode: "labor.wage_recovery",
    currency: "UZS",
    createdAt: "2026-06-03T09:00:00Z",
    updatedAt: "2026-06-03T10:00:00Z",
    messages: [
      {
        id: "mf1",
        role: "user",
        content: "Oyligim to'lanmagan.",
        createdAt: "2026-06-03T09:00:00Z",
      },
    ],
    facts: [
      {
        key: "employer_name",
        label: "Ish beruvchi",
        value: "",
        status: "missing",
      },
      {
        key: "salary_amount",
        label: "Oylik ish haqi",
        value: "",
        status: "missing",
      },
    ],
    classification: withConfidenceLevel({
      categoryCode: "labor.wage_recovery",
      label: "Mehnat nizosi — ish haqini undirish",
      confidence: 0.72,
      track: "claim",
      trackLabel: "Da'vo tartibi",
      trackRationale: "Ish haqi haqida, lekin faktlar to'liq emas.",
    }),
    route: WAGE_RECOVERY_ROUTE,
    statusHistory: statusHistory([
      { step: "describe", label: "Murojaat", at: "2026-06-03T09:00:00Z" },
      { step: "classify", label: "Ish haqi (qoralama)", at: "2026-06-03T09:30:00Z" },
      { step: "route", label: "Marshrut — faktlar yetishmaydi", at: "2026-06-03T10:00:00Z" },
    ]),
  },
  "case-intake-new": {
    id: "case-intake-new",
    title: "Yangi murojaat",
    status: "intake",
    step: "describe",
    currency: "UZS",
    createdAt: "2026-06-04T12:00:00Z",
    updatedAt: "2026-06-04T12:00:00Z",
    messages: [],
    facts: [],
    statusHistory: statusHistory([
      { step: "describe", label: "Yangi murojaat boshlandi", at: "2026-06-04T12:00:00Z" },
    ]),
  },
};

/** Resolve primary document + sync legacy `document` field. */
export function normalizeCaseDetail(detail: CaseDetail): CaseDetail {
  const documents = detail.documents ?? (detail.document ? [detail.document] : []);
  const document =
    detail.document ??
    documents.find((d) => d.kind === "davo_arizasi") ??
    documents[0];
  return {
    ...detail,
    documents: documents.length > 0 ? documents : undefined,
    document,
  };
}

export function getCaseDetail(id: string): CaseDetail | undefined {
  const raw = CASE_DETAILS[id];
  return raw ? normalizeCaseDetail(raw) : undefined;
}

export function createDemoCaseFromIntake(): CaseDetail {
  return normalizeCaseDetail({
    ...DEMO_CASE_DETAIL,
    id: DEMO_CASE_ID,
    status: "classified",
    step: "classify",
    messages: [
      {
        id: "intake-user-1",
        role: "user",
        content: DEMO_PROMPT_UZ,
        createdAt: new Date().toISOString(),
      },
    ],
    facts: DEMO_FACTS.filter((f) => f.status === "collected").slice(0, 4),
    document: undefined,
    documents: undefined,
    validation: undefined,
    route: undefined,
    statusHistory: [
      { step: "describe", label: "Murojaat qabul qilindi", at: new Date().toISOString() },
      { step: "classify", label: "Tasniflandi", at: new Date().toISOString() },
    ],
  });
}

export function getDocumentTemplate(
  caseId: string,
  docId: string,
): GeneratedDocument | undefined {
  const detail = getCaseDetail(caseId);
  if (!detail) return undefined;
  const docs = detail.documents ?? [];
  return docs.find((d) => d.id === docId) ?? (detail.document?.id === docId ? detail.document : undefined);
}
