import type {
  Advisory,
  DocSection,
  Issue,
  Party,
  Situation,
  SituationDocument,
  TimelineEvent,
  ValidationResult,
} from "../types/index";
import {
  caseDetailToSituation,
  computeReadiness,
  sectionsToPlainText,
  withConfidenceLevel,
  withSituationReadiness,
} from "../types/index";
import { DEMO_CASE_DETAIL, DEMO_CASE_ID } from "./fixtures";

export const DEMO_SITUATION_ID = "situation-demo-wage";
export const SCENARIO_A_ID = "situation-fraud-corruption";
export const SCENARIO_B_ID = "situation-workplace";
export const SCENARIO_C_ID = "situation-divorce";
export const SCENARIO_A_PROMPT =
  "Kompaniya mendan 50 million so'm oldi va yo'qoldi. Politsiya harakat qilmayapti. Ofitser poraga sotilgan deb o'ylayman.";
export const SCENARIO_B_PROMPT =
  "Rahbarim 3 oydan beri oyligimni to'lamayapti, jinsiy bezorilik qildi, rad etganimdan keyin ishdan bo'shatdi.";
export const SCENARIO_C_PROMPT =
  "Sobiq turmush o'rtog'im aliment to'lamayapti va umumiy kvartiramizni sotmoqchi.";

function doc(
  id: string,
  kind: SituationDocument["kind"],
  title: string,
  issueIds: string[],
  destination: SituationDocument["destination"],
  sections: DocSection[],
  validation?: ValidationResult,
): SituationDocument {
  return {
    id,
    kind,
    title,
    issueIds,
    destination,
    sections,
    plainText: sectionsToPlainText(sections),
    version: 1,
    status: "final",
    validation,
  };
}

function baseSituation(
  partial: Partial<Situation> &
    Pick<Situation, "id" | "title" | "status" | "createdAt" | "updatedAt" | "issues">,
): Situation {
  const merged: Situation = {
    locale: "uz",
    currency: "UZS",
    messages: [],
    facts: [],
    parties: [],
    evidence: [],
    timeline: [],
    documents: [],
    advisories: [],
    readiness: {
      documentsReady: 0,
      documentsTotal: 0,
      blockingAdvisoryIds: [],
      canExport: false,
    },
    ...partial,
  };
  return withSituationReadiness(merged);
}

const wageSituation = caseDetailToSituation({
  ...DEMO_CASE_DETAIL,
  id: DEMO_SITUATION_ID,
});
wageSituation.title = "Ish haqi — Oqtepa Logistics";

export const SCENARIO_A: Situation = baseSituation({
  id: SCENARIO_A_ID,
  title: "Investitsiya firibgarligi va korrupsiya",
  locale: "uz",
  currency: "UZS",
  facts: [],
  status: "ready",
  createdAt: "2026-06-01T08:00:00Z",
  updatedAt: "2026-06-04T12:00:00Z",
  messages: [
    {
      id: "m1",
      role: "user",
      content: SCENARIO_A_PROMPT,
      createdAt: "2026-06-01T08:00:00Z",
    },
    {
      id: "m2",
      role: "assistant",
      content:
        "To'rtta huquqiy yo'nalish aniqladim: fuqarolik da'vo, jinoiy shikoyat, korrupsiya arizasi va politsiya harakatsizligi bo'yicha ma'muriy shikoyat.",
      createdAt: "2026-06-01T08:05:00Z",
    },
  ],
  issues: [
    {
      id: "issue-a-civil",
      categoryCode: "fraud.investment",
      title: "Qarzni undirish — fuqarolik sudi",
      severity: "high",
      rationale: "Investitsiya shartnomasi bo'yicha 50 mln so'm",
      step: "validate",
      status: "validated",
      route: {
        court: "Toshkent shahar fuqarolik sudi",
        applicationType: "Da'vo arizasi",
        feeNote: "Davlat boji — da'vo bahosiga qarab",
        limitation: "Umumiy muddat [VERIFY]",
        legalBasis: ["Fuqarolik kodeksi", "FPK 188–191"],
        requiredDocuments: ["Shartnoma", "To'lov dalillari"],
      },
    },
    {
      id: "issue-a-criminal",
      categoryCode: "criminal.fraud_complaint",
      title: "Firibgarlik — prokuraturaga",
      severity: "critical",
      rationale: "Kompaniya yo'qolgani — jinoiy tekshiruv",
      step: "validate",
      status: "validated",
      route: {
        court: "Toshkent shahar prokuraturasi",
        applicationType: "Jinoiy ish bo'yicha ariza",
        feeNote: "—",
        limitation: "[VERIFY]",
        legalBasis: ["JK — firibgarlik [VERIFY]"],
        requiredDocuments: ["Dalillar"],
      },
    },
    {
      id: "issue-a-corruption",
      categoryCode: "criminal.corruption",
      title: "Korrupsiya — agentlikka",
      severity: "high",
      rationale: "Ofitser poraga sotilgan deb gumon",
      step: "validate",
      status: "validated",
    },
    {
      id: "issue-a-admin",
      categoryCode: "admin.police_inaction",
      title: "Politsiya harakatsizligi",
      severity: "medium",
      rationale: "Murojaatga javob berilmagan",
      step: "validate",
      status: "validated",
    },
  ],
  parties: [
    {
      id: "party-plaintiff",
      role: "plaintiff",
      kind: "person",
      name: "Karimov Jasur Shavkatovich",
      requisites: { address: "Toshkent sh., Yunusobod tumani", phone: "+998 90 111 22 33" },
      issueIds: ["issue-a-civil", "issue-a-criminal", "issue-a-corruption", "issue-a-admin"],
    },
    {
      id: "party-defendant-co",
      role: "defendant",
      kind: "organization",
      name: '"Invest Plus" MChJ',
      requisites: { stir: "301 222 333", address: "Toshkent sh. [VERIFY]" },
      issueIds: ["issue-a-civil", "issue-a-criminal"],
    },
    {
      id: "party-defendant-officer",
      role: "defendant",
      kind: "person",
      name: "Politsiya ofitseri (F.I.Sh. aniqlanmagan)",
      requisites: {},
      issueIds: ["issue-a-corruption"],
    },
  ],
  evidence: [
    {
      id: "ev-a1",
      kind: "contract",
      title: "Investitsiya shartnomasi",
      status: "uploaded",
      fileUrl: "/uploads/stub-contract.pdf",
      issueIds: ["issue-a-civil", "issue-a-criminal"],
      documentIds: ["doc-a-civil"],
    },
    {
      id: "ev-a2",
      kind: "receipt",
      title: "50 mln so'm o'tkazma kvitansiyasi",
      status: "uploaded",
      fileUrl: "/uploads/stub-receipt.pdf",
      issueIds: ["issue-a-civil"],
      documentIds: ["doc-a-civil"],
    },
  ],
  timeline: [
    {
      id: "tl-a1",
      date: "2025-11-15",
      label: "Investitsiya shartnomasi imzolandi",
      kind: "fact",
      issueIds: ["issue-a-civil"],
    },
    {
      id: "tl-a2",
      date: "2026-03-01",
      label: "Kompaniya aloqa uzdi",
      kind: "fact",
      issueIds: ["issue-a-civil", "issue-a-criminal"],
    },
    {
      id: "tl-a3",
      date: "2026-04-10",
      label: "Politsiyaga murojaat — javob yo'q",
      kind: "manual",
      issueIds: ["issue-a-admin"],
    },
  ],
  documents: [
    doc(
      "doc-a-civil",
      "davo_arizasi",
      "Da'vo arizasi — qarzni undirish",
      ["issue-a-civil"],
      "civil_court",
      [
        { id: "court", kind: "header", content: "Toshkent shahar fuqarolik sudiga", editable: false },
        {
          id: "body",
          kind: "body",
          content:
            '"Invest Plus" MChJ 50 000 000 so\'m investitsiyani qaytarmagan. Shartnoma va to\'lov dalillari ilovada.',
          editable: true,
        },
        {
          id: "demand",
          kind: "demand",
          content: "SO'RAYMAN: 50 000 000 so'm undirilsin.",
          editable: true,
        },
      ],
      { canFile: true, checks: [{ id: "demand", label: "Talab aniq", status: "ok", ground: "FPK 189(4)", fix: "" }] },
    ),
    doc(
      "doc-a-criminal",
      "prosecutor_complaint",
      "Jinoiy ish bo'yicha ariza",
      ["issue-a-criminal"],
      "prosecutor",
      [
        { id: "header", kind: "header", content: "Toshkent shahar prokuraturasiga", editable: false },
        {
          id: "body",
          kind: "body",
          content: "Firibgarlik: kompaniya mablag'ni olib yo'qolgan. [VERIFY JK]",
          editable: true,
        },
      ],
      { canFile: true, checks: [{ id: "facts", label: "Voqea bayon", status: "ok", ground: "[VERIFY]", fix: "" }] },
    ),
    doc(
      "doc-a-corruption",
      "admin_complaint",
      "Korrupsiya haqida ariza",
      ["issue-a-corruption"],
      "anticorruption_agency",
      [
        { id: "header", kind: "header", content: "Korrupsiyaga qarshi kurashish agentligiga", editable: false },
        {
          id: "body",
          kind: "body",
          content: "Politsiya ofitseri poraga sotilgan deb gumon qilaman. [VERIFY]",
          editable: true,
        },
      ],
      { canFile: true, checks: [{ id: "applicant", label: "Murojaatchi", status: "ok", ground: "[VERIFY]", fix: "" }] },
    ),
    doc(
      "doc-a-admin",
      "admin_complaint",
      "Politsiya harakatsizligi",
      ["issue-a-admin"],
      "prosecutor",
      [
        { id: "body", kind: "body", content: "Murojaatim ko'rib chiqilmagan. [VERIFY]", editable: true },
      ],
      { canFile: true, checks: [{ id: "facts", label: "Murojaat sanasi", status: "ok", ground: "[VERIFY]", fix: "" }] },
    ),
  ],
  advisories: [
    {
      id: "adv-a1",
      kind: "strategic_recommendation",
      severity: "high",
      title: "To'rtta alohida organ",
      body: "Har bir hujjat o'z forumiga topshiriladi. Fuqarolik, prokuratura va agentlik — alohida.",
      status: "acknowledged",
      issueIds: [],
      documentIds: [],
    },
    {
      id: "adv-a2",
      kind: "compliance_note",
      severity: "info",
      title: "Maslahat emas",
      body: "Areeza — tayyorlash va tekshiruv vositasi; yakuniy qaror inson va organlarda.",
      status: "open",
      issueIds: [],
      documentIds: [],
    },
  ],
  activeIssueId: "issue-a-civil",
});

export const SCENARIO_B: Situation = baseSituation({
  id: SCENARIO_B_ID,
  title: "Bezorilik, ish haqi va ishdan bo'shatish",
  locale: "uz",
  currency: "UZS",
  facts: [],
  status: "in_progress",
  createdAt: "2026-05-20T10:00:00Z",
  updatedAt: "2026-06-04T11:00:00Z",
  messages: [
    { id: "mb1", role: "user", content: SCENARIO_B_PROMPT, createdAt: "2026-05-20T10:00:00Z" },
    {
      id: "mb2",
      role: "assistant",
      content: "To'rtta masala: ish haqi, ishga qaytarish (1 oylik muddat!) va jinsiy bezorilik.",
      createdAt: "2026-05-20T10:10:00Z",
    },
  ],
  issues: [
    {
      id: "issue-b-wage",
      categoryCode: "labor.wage_recovery",
      title: "Ish haqini undirish",
      severity: "high",
      rationale: "3 oy to'lanmagan",
      step: "validate",
      status: "validated",
      classification: withConfidenceLevel({
        categoryCode: "labor.wage_recovery",
        label: "Ish haqi",
        confidence: 0.95,
        track: "claim",
        trackLabel: "Da'vo",
        trackRationale: "Nizoli",
      }),
    },
    {
      id: "issue-b-reinstate",
      categoryCode: "labor.reinstatement",
      title: "Ishga qaytarish",
      severity: "critical",
      rationale: "Noqonuniy ishdan bo'shatish",
      step: "route",
      status: "routed",
      route: {
        court: "Tuman fuqarolik sudi",
        applicationType: "Da'vo arizasi",
        feeNote: "Ozod",
        limitation: "1 oy — ishdan bo'shatilgan kundan",
        legalBasis: ["Mehnat kodeksi [VERIFY]", "FPK 188–191"],
        requiredDocuments: ["Buyruq", "Mehnat shartnomasi"],
      },
    },
    {
      id: "issue-b-harass",
      categoryCode: "labor.harassment",
      title: "Jinsiy bezorilik",
      severity: "critical",
      rationale: "Jinoiy tekshiruv talab qilinadi",
      step: "prepare",
      status: "drafted",
    },
    {
      id: "issue-b-labor-admin",
      categoryCode: "admin.labor_complaint",
      title: "Mehnat inspeksiyasiga shikoyat",
      severity: "medium",
      rationale: "Mehnat huquqlari buzilishi",
      step: "route",
      status: "routed",
    },
  ],
  parties: [
    {
      id: "pb-plaintiff",
      role: "plaintiff",
      kind: "person",
      name: "Nazarova Dilnoza Rustamovna",
      requisites: { address: "Samarqand sh." },
      issueIds: ["issue-b-wage", "issue-b-reinstate", "issue-b-harass", "issue-b-labor-admin"],
    },
    {
      id: "pb-defendant",
      role: "defendant",
      kind: "organization",
      name: '"TexServis" MChJ',
      requisites: { stir: "302 444 555" },
      issueIds: ["issue-b-wage", "issue-b-reinstate"],
    },
    {
      id: "pb-witness",
      role: "witness",
      kind: "person",
      name: "Hamkasb (F.I.Sh. keyinroq)",
      requisites: {},
      issueIds: ["issue-b-harass"],
    },
  ],
  evidence: [
    {
      id: "ev-b1",
      kind: "correspondence",
      title: "Ish haqi hisob-kitobi",
      status: "uploaded",
      issueIds: ["issue-b-wage"],
      documentIds: ["doc-b-wage"],
    },
  ],
  timeline: [
    {
      id: "tl-b1",
      date: "2026-01-15",
      label: "Ishga qabul",
      kind: "fact",
      issueIds: ["issue-b-wage"],
    },
    {
      id: "tl-b2",
      date: "2026-04-01",
      label: "Ishdan bo'shatish",
      kind: "fact",
      issueIds: ["issue-b-reinstate"],
    },
    {
      id: "tl-b3",
      date: "2026-05-01",
      label: "1 oylik muddat chegarasi",
      kind: "deadline",
      issueIds: ["issue-b-reinstate"],
    },
  ],
  documents: [
    doc("doc-b-wage", "davo_arizasi", "Da'vo — ish haqi", ["issue-b-wage"], "civil_court", [
      { id: "title", kind: "title", content: "DA'VO ARIZASI (ish haqi)", editable: false },
      { id: "body", kind: "body", content: "3 oy ish haqi to'lanmagan.", editable: true },
    ]),
    doc("doc-b-reinstate", "davo_arizasi", "Da'vo — ishga qaytarish", ["issue-b-reinstate"], "civil_court", [
      { id: "body", kind: "body", content: "Noqonuniy ishdan bo'shatish. [VERIFY]", editable: true },
    ]),
    doc("doc-b-harass", "prosecutor_complaint", "Jinoiy ariza — bezorilik", ["issue-b-harass"], "prosecutor", [
      { id: "body", kind: "body", content: "Jinsiy bezorilik haqida. [VERIFY]", editable: true },
    ]),
    doc("doc-b-labor", "admin_complaint", "Mehnat inspeksiyasi", ["issue-b-labor-admin"], "labor_inspectorate", [
      { id: "body", kind: "body", content: "Mehnat huquqlari buzilgan. [VERIFY]", editable: true },
    ]),
  ],
  advisories: [
    {
      id: "adv-b-urgent",
      kind: "deadline_warning",
      severity: "urgent",
      title: "Ishga qaytarish — 1 oylik muddat",
      body: "Ishdan bo'shatilgan kundan 1 oy ichida da'vo berish kerak. Qolgan vaqt kam! [VERIFY moddalar]",
      status: "open",
      issueIds: ["issue-b-reinstate"],
      documentIds: ["doc-b-reinstate"],
    },
    {
      id: "adv-b-gap",
      kind: "evidence_gap",
      severity: "high",
      title: "Guvoh qo'shing",
      body: "Bezorilik bo'yicha guvoh yoki yozishmalar ilova qiling.",
      status: "open",
      issueIds: ["issue-b-harass"],
      documentIds: [],
    },
  ],
  activeIssueId: "issue-b-reinstate",
});

export const SCENARIO_C: Situation = baseSituation({
  id: SCENARIO_C_ID,
  title: "Aliment, mulk va ta'minlov",
  locale: "uz",
  currency: "UZS",
  facts: [],
  status: "validated",
  createdAt: "2026-05-01T09:00:00Z",
  updatedAt: "2026-06-04T10:30:00Z",
  messages: [
    { id: "mc1", role: "user", content: SCENARIO_C_PROMPT, createdAt: "2026-05-01T09:00:00Z" },
    {
      id: "mc2",
      role: "assistant",
      content: "Aliment undirish, mulk bo'linishi va kvartira sotilishini to'xtatish uchun ta'minlov arizasi.",
      createdAt: "2026-05-01T09:15:00Z",
    },
  ],
  issues: [
    {
      id: "issue-c-alimony",
      categoryCode: "family.alimony_enforcement",
      title: "Aliment undirish",
      severity: "high",
      rationale: "To'lov to'xtatilgan",
      step: "validate",
      status: "validated",
    },
    {
      id: "issue-c-property",
      categoryCode: "family.property_division",
      title: "Mulk bo'linishi",
      severity: "medium",
      rationale: "Umumiy kvartira",
      step: "validate",
      status: "validated",
    },
    {
      id: "issue-c-injunction",
      categoryCode: "family.injunction",
      title: "Sotuvni to'xtatish (ta'minlov)",
      severity: "critical",
      rationale: "Shoshilinch",
      step: "validate",
      status: "validated",
    },
  ],
  parties: [
    {
      id: "pc-plaintiff",
      role: "plaintiff",
      kind: "person",
      name: "Mirzayeva Nigora",
      requisites: {},
      issueIds: ["issue-c-alimony", "issue-c-property", "issue-c-injunction"],
    },
    {
      id: "pc-defendant",
      role: "defendant",
      kind: "person",
      name: "Mirzayev Bobur (sobiq turmush o'rtog'i)",
      requisites: { address: "Toshkent sh." },
      issueIds: ["issue-c-alimony", "issue-c-property", "issue-c-injunction"],
    },
  ],
  evidence: [
    {
      id: "ev-c1",
      kind: "official_record",
      title: "Nikoh bekor qilinganligi haqida guvohnoma",
      status: "uploaded",
      issueIds: ["issue-c-property"],
      documentIds: [],
    },
    {
      id: "ev-c2",
      kind: "correspondence",
      title: "Rieltor bilan yozishma (sotuv)",
      status: "uploaded",
      issueIds: ["issue-c-injunction"],
      documentIds: ["doc-c-injunction"],
    },
  ],
  timeline: [
    {
      id: "tl-c1",
      date: "2024-06-01",
      label: "Nikoh bekor qilindi",
      kind: "fact",
      issueIds: ["issue-c-alimony", "issue-c-property"],
    },
    {
      id: "tl-c2",
      date: "2026-06-03",
      label: "Kvartira sotuvi e'lon qilindi",
      kind: "fact",
      issueIds: ["issue-c-injunction"],
    },
  ],
  documents: [
    doc("doc-c-alimony", "court_order_petition", "Aliment — sud buyrug'i", ["issue-c-alimony"], "family_court", [
      { id: "body", kind: "body", content: "Aliment to'lanmayapti. [VERIFY Oila kodeksi]", editable: true },
    ]),
    doc("doc-c-property", "davo_arizasi", "Mulk bo'linishi", ["issue-c-property"], "civil_court", [
      { id: "body", kind: "body", content: "Umumiy kvartira ulushini ajratish. [VERIFY]", editable: true },
    ]),
    doc("doc-c-injunction", "injunction_petition", "Ta'minlov — sotuvni to'xtatish", ["issue-c-injunction"], "civil_court", [
      { id: "body", kind: "body", content: "Kvartira sotilmasin — shoshilinch. [VERIFY FPK]", editable: true },
    ]),
  ],
  advisories: [
    {
      id: "adv-c-urgent",
      kind: "deadline_warning",
      severity: "urgent",
      title: "Shoshilinch: sotuv yaqin",
      body: "Ta'minlov arizasini kechiktirmang — mulk yo'qolishi mumkin.",
      status: "open",
      issueIds: ["issue-c-injunction"],
      documentIds: ["doc-c-injunction"],
    },
  ],
  activeIssueId: "issue-c-injunction",
});

const debtSituation = caseDetailToSituation({
  id: "situation-debt",
  title: "Qarz — Karimov B.",
  status: "classified",
  step: "classify",
  categoryCode: "debt.recovery",
  currency: "UZS",
  createdAt: "2026-05-10T08:00:00Z",
  updatedAt: "2026-05-10T08:00:00Z",
  messages: [
    {
      id: "md1",
      role: "user",
      content: "Qarzdorim 10 mln so'mni qaytarmayapti.",
      createdAt: "2026-05-10T08:00:00Z",
    },
  ],
  facts: [],
});

export const SITUATION_LIST: Pick<Situation, "id" | "title" | "status" | "createdAt" | "updatedAt" | "readiness">[] = [
  { id: wageSituation.id, title: wageSituation.title, status: wageSituation.status, createdAt: wageSituation.createdAt, updatedAt: wageSituation.updatedAt, readiness: wageSituation.readiness },
  { id: SCENARIO_A.id, title: SCENARIO_A.title, status: SCENARIO_A.status, createdAt: SCENARIO_A.createdAt, updatedAt: SCENARIO_A.updatedAt, readiness: SCENARIO_A.readiness },
  { id: SCENARIO_B.id, title: SCENARIO_B.title, status: SCENARIO_B.status, createdAt: SCENARIO_B.createdAt, updatedAt: SCENARIO_B.updatedAt, readiness: SCENARIO_B.readiness },
  { id: SCENARIO_C.id, title: SCENARIO_C.title, status: SCENARIO_C.status, createdAt: SCENARIO_C.createdAt, updatedAt: SCENARIO_C.updatedAt, readiness: SCENARIO_C.readiness },
  { id: debtSituation.id, title: debtSituation.title, status: debtSituation.status, createdAt: debtSituation.createdAt, updatedAt: debtSituation.updatedAt, readiness: debtSituation.readiness },
];

const SITUATION_MAP: Record<string, Situation> = {
  [wageSituation.id]: wageSituation,
  [SCENARIO_A.id]: SCENARIO_A,
  [SCENARIO_B.id]: SCENARIO_B,
  [SCENARIO_C.id]: SCENARIO_C,
  [debtSituation.id]: debtSituation,
};

export function getSituationDetail(id: string): Situation | undefined {
  return SITUATION_MAP[id] ? structuredClone(SITUATION_MAP[id]) : undefined;
}

export function resolveSituationIdFromPrompt(text: string): string {
  const n = text.toLowerCase();
  if (n.includes("50") && (n.includes("million") || n.includes("mln") || n.includes("aldash") || n.includes("firibgar")))
    return SCENARIO_A_ID;
  if (n.includes("bezorilik") || n.includes("jinsiy") || (n.includes("boshat") && n.includes("oylig")))
    return SCENARIO_B_ID;
  if (n.includes("aliment") || n.includes("turmush") || n.includes("kvartira") || n.includes("sotmoqchi"))
    return SCENARIO_C_ID;
  if (n.includes("oylig") || n.includes("ish haq") || n.includes("maosh")) return DEMO_SITUATION_ID;
  return "situation-intake-new";
}

/** Legacy case id → situation id */
export function caseIdToSituationId(caseId: string): string {
  if (caseId === DEMO_CASE_ID) return DEMO_SITUATION_ID;
  if (caseId.startsWith("case-")) return caseId.replace(/^case-/, "situation-");
  return caseId;
}
