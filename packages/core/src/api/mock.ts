import type {
  Case,
  CaseDetail,
  CaseFact,
  CaseMessage,
  CaseSummaryCounts,
  Classification,
  ClassifyResponse,
  DraftStreamEvent,
  ExportResponse,
  GeneratedDocument,
  IntakeEvent,
  LegalRoute,
  RegenerateSectionRequest,
  RouteRequest,
  UpdateDocumentRequest,
  ValidationResult,
} from "../types/index";
import { sectionsToPlainText, withConfidenceLevel } from "../types/index";
import { getRouteForCategory } from "../legal/index";
import {
  CASE_LIST,
  DEMO_CASE_DETAIL,
  DEMO_CASE_ID,
  DEMO_CLASSIFICATION,
  DEMO_DOCUMENT,
  DEMO_FACTS,
  DEMO_PROMPT_UZ,
  DEMO_VALIDATION,
  getCaseDetail,
  getDocumentTemplate,
  normalizeCaseDetail,
} from "./fixtures";
import { validate as zodValidate } from "./validate";
import { maybeThrowMockFailure } from "./mock-failure";

const deletedCaseIds = new Set<string>();

function seedRuntimeCases(): Record<string, CaseDetail> {
  const store: Record<string, CaseDetail> = {};
  for (const c of CASE_LIST) {
    const detail = getCaseDetail(c.id);
    if (detail) store[c.id] = structuredClone(normalizeCaseDetail(detail));
  }
  if (!store[DEMO_CASE_ID]) {
    store[DEMO_CASE_ID] = structuredClone(normalizeCaseDetail(DEMO_CASE_DETAIL));
  }
  return store;
}

const runtimeCases: Record<string, CaseDetail> = seedRuntimeCases();

function ensureCase(id: string): CaseDetail {
  let c = runtimeCases[id] ?? getCaseDetail(id);
  if (!c && id === DEMO_CASE_ID) {
    c = structuredClone(DEMO_CASE_DETAIL);
  }
  if (!c) {
    c = {
      id,
      title: "Yangi murojaat",
      status: "intake",
      step: "describe",
      currency: "UZS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      facts: [],
      classification: DEMO_CLASSIFICATION,
      statusHistory: [
        {
          step: "describe",
          label: "Yangi murojaat boshlandi",
          at: new Date().toISOString(),
        },
      ],
    };
  }
  const normalized = normalizeCaseDetail(c);
  runtimeCases[id] = normalized;
  return normalized;
}

function persistCase(c: CaseDetail): CaseDetail {
  const normalized = normalizeCaseDetail(c);
  runtimeCases[c.id] = normalized;
  return zodValidate.caseDetail(normalized);
}

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("Aborted"));
    });
  });

function chunkText(text: string, size = 12): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks.length > 0 ? chunks : [text];
}

const INTAKE_SCRIPT: Array<{
  afterMs: number;
  event: IntakeEvent;
}> = [
  {
    afterMs: 400,
    event: {
      type: "assistant_delta",
      delta: "Tushundim — ish haqi to'lanmagan holat. ",
    },
  },
  {
    afterMs: 800,
    event: {
      type: "question",
      question: "Ish beruvchingizning nomi va manzilini ayta olasizmi?",
      factKey: "employer_name",
    },
  },
  {
    afterMs: 1200,
    event: {
      type: "fact",
      fact: DEMO_FACTS[0]!,
    },
  },
  {
    afterMs: 1600,
    event: {
      type: "fact",
      fact: DEMO_FACTS[1]!,
    },
  },
  {
    afterMs: 2000,
    event: {
      type: "question",
      question: "Lavozimingiz va oylik ish haqingiz qancha? Qaysi oylardan beri to'lanmagan?",
      factKey: "salary_amount",
    },
  },
  {
    afterMs: 2400,
    event: {
      type: "fact",
      fact: DEMO_FACTS[4]!,
    },
  },
  {
    afterMs: 2800,
    event: {
      type: "fact",
      fact: DEMO_FACTS[5]!,
    },
  },
  {
    afterMs: 3200,
    event: {
      type: "fact",
      fact: DEMO_FACTS[6]!,
    },
  },
  {
    afterMs: 3600,
    event: {
      type: "fact",
      fact: DEMO_FACTS[7]!,
    },
  },
  {
    afterMs: 4200,
    event: {
      type: "classified",
      classification: DEMO_CLASSIFICATION,
    },
  },
  {
    afterMs: 4500,
    event: {
      type: "done",
      situationId: DEMO_CASE_ID,
      caseId: DEMO_CASE_ID,
    },
  },
];

export async function* streamIntake(
  _caseId: string | undefined,
  initialText: string,
  signal?: AbortSignal,
): AsyncGenerator<IntakeEvent> {
  maybeThrowMockFailure("streamIntake");
  if (!initialText.trim()) {
    initialText = DEMO_PROMPT_UZ;
  }
  let elapsed = 0;
  for (const step of INTAKE_SCRIPT) {
    const wait = step.afterMs - elapsed;
    if (wait > 0) await delay(wait, signal);
    elapsed = step.afterMs;
    yield step.event;
  }
}

export async function listCases(): Promise<Case[]> {
  maybeThrowMockFailure("listCases");
  await delay(300);
  const visible = CASE_LIST.filter((c) => !deletedCaseIds.has(c.id));
  return zodValidate.caseList(visible);
}

export async function deleteCase(id: string): Promise<void> {
  maybeThrowMockFailure("deleteCase");
  await delay(250);
  deletedCaseIds.add(id);
  delete runtimeCases[id];
}

export function computeCaseSummaryCounts(cases: Case[]): CaseSummaryCounts {
  const counts: CaseSummaryCounts = {
    total: cases.length,
    intake: 0,
    inProgress: 0,
    draft: 0,
    ready: 0,
  };
  for (const c of cases) {
    if (c.status === "intake") counts.intake += 1;
    if (c.status === "ready") counts.ready += 1;
    if (c.status === "validated" || c.status === "drafted") counts.draft += 1;
    if (
      c.status === "classified" ||
      c.status === "routed" ||
      c.status === "draft"
    ) {
      counts.inProgress += 1;
    }
  }
  return zodValidate.summaryCounts(counts);
}

export async function getCaseSummaryCounts(): Promise<CaseSummaryCounts> {
  maybeThrowMockFailure("getCaseSummaryCounts");
  await delay(150);
  const visible = CASE_LIST.filter((c) => !deletedCaseIds.has(c.id));
  return computeCaseSummaryCounts(visible);
}

export async function getCase(id: string): Promise<CaseDetail | null> {
  maybeThrowMockFailure("getCase");
  await delay(200);
  if (deletedCaseIds.has(id)) return null;
  const detail = runtimeCases[id] ?? getCaseDetail(id);
  if (detail) return zodValidate.caseDetail(structuredClone(normalizeCaseDetail(detail)));
  if (id === DEMO_CASE_ID) return zodValidate.caseDetail(structuredClone(ensureCase(DEMO_CASE_ID)));
  return null;
}

const GIBBERISH_RE = /^[\s\da-z]+$/i;

export async function classify(text: string): Promise<ClassifyResponse> {
  await delay(500);
  const normalized = text.trim().toLowerCase();

  if (!normalized || normalized.length < 4) {
    return zodValidate.classification(
      withConfidenceLevel({
        categoryCode: "other",
        label: "Murojaat matni yetarli emas",
        confidence: 0.2,
        track: "claim",
        trackLabel: "Aniqlanmadi",
        trackRationale: "Qisqa yoki bo'sh matn — tasniflab bo'lmaydi.",
        clarifyingQuestion: "Muammoingizni bir-ikki jumla bilan tushuntiring.",
      }),
    );
  }

  if (GIBBERISH_RE.test(normalized) && normalized.length < 30) {
    return zodValidate.classification(
      withConfidenceLevel({
        categoryCode: "other",
        label: "Boshqa turdagi murojaat",
        confidence: 0.25,
        track: "claim",
        trackLabel: "Aniqlanmadi",
        trackRationale: "Matn tushunarli emas.",
        clarifyingQuestion: "Qaysi turdagi ish bo'yicha murojaat qilmoqchisiz?",
      }),
    );
  }

  if (
    normalized.includes("oylik") ||
    normalized.includes("ish haq") ||
    normalized.includes("зарплат") ||
    normalized.includes("maosh")
  ) {
    return zodValidate.classification(DEMO_CLASSIFICATION);
  }

  if (
    normalized.includes("ishdan") ||
    normalized.includes("bo'shat") ||
    normalized.includes("увол")
  ) {
    return zodValidate.classification(
      withConfidenceLevel({
        categoryCode: "labor.reinstatement",
        label: "Mehnat nizosi — ishga qaytarish",
        confidence: 0.85,
        track: "claim",
        trackLabel: "Da'vo tartibi",
        trackRationale: "Ishdan bo'shatish haqida.",
      }),
    );
  }

  if (normalized.includes("qarz") || normalized.includes("долг")) {
    return zodValidate.classification(
      withConfidenceLevel({
        categoryCode: "debt.recovery",
        label: "Qarzni undirish",
        confidence: 0.78,
        track: "claim",
        trackLabel: "Da'vo tartibi",
        trackRationale: "Qarz haqida.",
      }),
    );
  }

  if (
    normalized.includes("xizmat") ||
    normalized.includes("iste'mol") ||
    normalized.includes("remont")
  ) {
    return zodValidate.classification(
      withConfidenceLevel({
        categoryCode: "consumer.dispute",
        label: "Iste'molchi nizosi",
        confidence: 0.76,
        track: "claim",
        trackLabel: "Da'vo tartibi",
        trackRationale: "Xizmat/yoki mahsulot nizosi.",
      }),
    );
  }

  if (normalized.includes("aliment") || normalized.includes("farzand")) {
    return zodValidate.classification(
      withConfidenceLevel({
        categoryCode: "family.child_support",
        label: "Oila nizosi — aliment",
        confidence: 0.88,
        track: "court_order",
        trackLabel: "Sud buyrug'i tartibi",
        trackRationale: "Aliment bo'yicha.",
      }),
    );
  }

  if (normalized.includes("bilmayman") || normalized.includes("yoki")) {
    return zodValidate.classification(
      withConfidenceLevel({
        categoryCode: "debt.recovery",
        label: "Qarzni undirish (aniqlanmagan)",
        confidence: 0.48,
        track: "claim",
        trackLabel: "Da'vo tartibi",
        trackRationale: "Matnda aniq kategoriya ajratilmadi.",
        clarifyingQuestion:
          "Bu ish haqi, qarz yoki xizmat ko'rsatish nizosimi? Qisqacha tushuntiring.",
      }),
    );
  }

  return zodValidate.classification(
    withConfidenceLevel({
      categoryCode: "other",
      label: "Boshqa turdagi nizo",
      confidence: 0.42,
      track: "claim",
      trackLabel: "Da'vo tartibi",
      trackRationale: "Qo'shimcha ma'lumot kerak.",
      clarifyingQuestion: "Qaysi turdagi ish bo'yicha murojaat qilmoqchisiz?",
    }),
  );
}

export async function route(req: RouteRequest): Promise<LegalRoute> {
  await delay(400);
  const r =
    getRouteForCategory(req.categoryCode) ?? {
      court: "Tuman (shahar) fuqarolik sudi",
      applicationType: "Da'vo arizasi",
      feeNote: "Davlat boji qoidalari qo'llanadi.",
      limitation: "Muddat tekshiriladi.",
      legalBasis: ["FPK 188–191"],
      requiredDocuments: ["Da'vo arizasi nusxalari"],
    };
  return zodValidate.route(r);
}

export async function applyRoute(caseId: string, req: RouteRequest): Promise<LegalRoute> {
  const routeResult = await route(req);
  const c = ensureCase(caseId);
  c.route = routeResult;
  c.status = "routed";
  c.step = "route";
  c.updatedAt = new Date().toISOString();
  c.statusHistory = [
    ...(c.statusHistory ?? []),
    {
      step: "route",
      label: "Marshrut tayyorlandi",
      at: c.updatedAt,
    },
  ];
  return persistCase(c).route!;
}

export async function* streamDraft(
  caseId: string,
  docId: string,
  signal?: AbortSignal,
): AsyncGenerator<DraftStreamEvent> {
  const template =
    getDocumentTemplate(caseId, docId) ??
    (docId === DEMO_DOCUMENT.id ? DEMO_DOCUMENT : undefined);

  if (!template) {
    throw new Error(`Document template not found: ${docId}`);
  }

  const generating: GeneratedDocument = {
    ...template,
    status: "generating",
    version: template.version + 1,
    sections: template.sections.map((s) => ({ ...s, content: "" })),
    plainText: "",
  };

  const c = ensureCase(caseId);
  const docs = [...(c.documents ?? [])];
  const idx = docs.findIndex((d) => d.id === docId);
  if (idx >= 0) docs[idx] = generating;
  else docs.push(generating);
  c.documents = docs;
  c.document = generating.kind === "davo_arizasi" ? generating : c.document;
  persistCase(c);

  const builtSections: GeneratedDocument["sections"] = [];

  for (const section of template.sections) {
    const startEvent: DraftStreamEvent = {
      type: "section_start",
      sectionId: section.id,
      kind: section.kind,
    };
    yield zodValidate.draftStreamEvent(startEvent);

    let content = "";
    for (const chunk of chunkText(section.content, 14)) {
      if (signal?.aborted) throw new Error("Aborted");
      await delay(45, signal);
      content += chunk;
      const chunkEvent: DraftStreamEvent = {
        type: "chunk",
        sectionId: section.id,
        delta: chunk,
      };
      yield zodValidate.draftStreamEvent(chunkEvent);
    }

    const doneSection = { ...section, content };
    builtSections.push(doneSection);

    const sectionDoneEvent: DraftStreamEvent = {
      type: "section_done",
      sectionId: section.id,
      content,
    };
    yield zodValidate.draftStreamEvent(sectionDoneEvent);
  }

  const finalDoc: GeneratedDocument = {
    ...template,
    sections: builtSections,
    plainText:
      template.kind === "davo_arizasi" && template.id === DEMO_DOCUMENT.id
        ? template.plainText
        : sectionsToPlainText(builtSections),
    status: "draft",
    version: generating.version,
  };

  const validatedDoc = zodValidate.document(finalDoc);
  const doneEvent: DraftStreamEvent = { type: "done", document: validatedDoc };
  yield zodValidate.draftStreamEvent(doneEvent);

  const updated = ensureCase(caseId);
  const nextDocs = [...(updated.documents ?? [])];
  const docIdx = nextDocs.findIndex((d) => d.id === docId);
  if (docIdx >= 0) nextDocs[docIdx] = validatedDoc;
  else nextDocs.push(validatedDoc);
  updated.documents = nextDocs;
  updated.document =
    validatedDoc.kind === "davo_arizasi" ? validatedDoc : updated.document;
  updated.status = "drafted";
  updated.step = "prepare";
  updated.updatedAt = new Date().toISOString();
  updated.statusHistory = [
    ...(updated.statusHistory ?? []),
    {
      step: "prepare",
      label: `${validatedDoc.title} tayyorlandi`,
      at: updated.updatedAt,
    },
  ];
  persistCase(updated);
}

export async function regenerateSection(
  req: RegenerateSectionRequest,
): Promise<GeneratedDocument> {
  await delay(700);
  const c = ensureCase(req.situationId ?? (req as { caseId?: string }).caseId ?? "");
  const docs = c.documents ?? [];
  const doc = docs.find((d) => d.id === req.documentId) ?? c.document;
  if (!doc) throw new Error("Document not found");

  const section = doc.sections.find((s) => s.id === req.sectionId);
  if (!section) throw new Error("Section not found");

  const enhanced =
    req.instruction?.trim() ?
      `${section.content}\n\n[Kuchaytirilgan: ${req.instruction.trim()}]`
    : `${section.content}\n\n(Qayta ishlangan — aniqroq bayon.)`;

  const nextSections = doc.sections.map((s) =>
    s.id === req.sectionId ? { ...s, content: enhanced } : s,
  );

  const nextDoc: GeneratedDocument = {
    ...doc,
    sections: nextSections,
    plainText: sectionsToPlainText(nextSections),
    version: doc.version + 1,
    status: doc.status === "generating" ? "draft" : doc.status,
  };

  const validated = zodValidate.document(nextDoc);
  const nextDocs = docs.map((d) => (d.id === validated.id ? validated : d));
  c.documents = nextDocs;
  if (c.document?.id === validated.id) c.document = validated;
  c.updatedAt = new Date().toISOString();
  persistCase(c);
  return validated;
}

export async function updateDocument(req: UpdateDocumentRequest): Promise<GeneratedDocument> {
  maybeThrowMockFailure("updateDocument");
  await delay(200);
  const validated = zodValidate.document(req.document);
  const c = ensureCase(req.situationId ?? (req as { caseId?: string }).caseId ?? "");
  const docs = [...(c.documents ?? [])];
  const idx = docs.findIndex((d) => d.id === validated.id);
  if (idx >= 0) docs[idx] = validated;
  else docs.push(validated);
  c.documents = docs;
  if (c.document?.id === validated.id || validated.kind === "davo_arizasi") {
    c.document = validated;
  }
  c.updatedAt = new Date().toISOString();
  persistCase(c);
  return validated;
}

export async function draft(caseId: string): Promise<GeneratedDocument> {
  await delay(800);
  const doc = zodValidate.document(DEMO_DOCUMENT);
  const c = ensureCase(caseId);
  const docs = [...(c.documents ?? [])];
  const existing = docs.findIndex((d) => d.id === doc.id);
  if (existing >= 0) docs[existing] = doc;
  else docs.unshift(doc);
  c.documents = docs;
  c.document = doc;
  c.status = "drafted";
  c.step = "prepare";
  c.updatedAt = new Date().toISOString();
  c.statusHistory = [
    ...(c.statusHistory ?? []),
    { step: "prepare", label: "Da'vo arizasi tayyorlandi", at: c.updatedAt },
  ];
  persistCase(c);
  return doc;
}

export async function validate(
  caseId: string,
  _documentId: string,
): Promise<ValidationResult> {
  maybeThrowMockFailure("validate");
  await delay(600);
  const c = ensureCase(caseId);
  c.validation = zodValidate.validation(DEMO_VALIDATION);
  c.status = "validated";
  c.step = "validate";
  c.updatedAt = new Date().toISOString();
  c.statusHistory = [
    ...(c.statusHistory ?? []),
    {
      step: "validate",
      label: "Tekshiruv o'tkazildi",
      at: c.updatedAt,
      note: "Ilovalar tekshirildi",
    },
  ];
  persistCase(c);
  return c.validation;
}

export async function exportPackage(caseId: string): Promise<ExportResponse> {
  maybeThrowMockFailure("exportPackage");
  await delay(500);
  return zodValidate.export({
    pdfUrl: `/api/mock-export/${caseId}.pdf`,
    packageName: `areeza-topshiriq-${caseId}.pdf`,
  });
}

export function seedIntakeFacts(): CaseFact[] {
  return DEMO_FACTS.filter((f) => f.status === "collected");
}

/** Persist intake transcript + facts when transitioning to the workspace. */
export function persistIntakeSession(
  caseId: string,
  messages: CaseMessage[],
  facts: CaseFact[],
  classification: Classification,
): void {
  const c = ensureCase(caseId);
  c.messages = messages;
  c.facts = facts.length > 0 ? facts : c.facts;
  c.classification = zodValidate.classification(classification);
  c.status = "classified";
  c.step = "classify";
  c.categoryCode = classification.categoryCode;
  c.updatedAt = new Date().toISOString();
  c.statusHistory = [
    ...(c.statusHistory ?? []),
    {
      step: "classify",
      label: classification.label,
      at: c.updatedAt,
      note: classification.confidenceLevel,
    },
  ];
  persistCase(c);
}
