import type {
  ExportResponse,
  IntakeEvent,
  Situation,
  SituationDocument,
  SituationSummaryCounts,
  UpdateDocumentRequest,
  UploadResponse,
  ValidationResult,
} from "../types/index";
import { withSituationReadiness } from "../types/index";
import {
  DEMO_SITUATION_ID,
  getSituationDetail,
  SITUATION_LIST,
} from "./situation-fixtures";
import { streamScriptedIntake } from "./scripted-intake";
import { validate as zodValidate } from "./validate";
import { maybeThrowMockFailure } from "./mock-failure";

const deletedIds = new Set<string>();

function seedRuntime(): Record<string, Situation> {
  const store: Record<string, Situation> = {};
  for (const row of SITUATION_LIST) {
    const detail = getSituationDetail(row.id);
    if (detail) store[row.id] = structuredClone(detail);
  }
  return store;
}

const runtimeSituations: Record<string, Situation> = seedRuntime();

function ensureSituation(id: string): Situation {
  let s = runtimeSituations[id] ?? getSituationDetail(id);
  if (!s) {
    s = withSituationReadiness({
      id,
      title: "Yangi holat",
      status: "intake",
      locale: "uz",
      currency: "UZS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      facts: [],
      issues: [],
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
    });
  }
  const normalized = withSituationReadiness(s);
  runtimeSituations[id] = normalized;
  return normalized;
}

function persist(s: Situation): Situation {
  const normalized = withSituationReadiness(s);
  runtimeSituations[s.id] = normalized;
  return zodValidate.situation(normalized);
}

export function listSituations(): Promise<Situation[]> {
  maybeThrowMockFailure("listSituations");
  return Promise.resolve(
    SITUATION_LIST.filter((r) => !deletedIds.has(r.id))
      .map((r) => ensureSituation(r.id))
      .map((s) => ({
        ...s,
        messages: [],
        facts: [],
        issues: s.issues,
        parties: [],
        evidence: [],
        timeline: [],
        documents: [],
        advisories: [],
      })),
  );
}

export function getSituationSummaryCounts(): Promise<SituationSummaryCounts> {
  maybeThrowMockFailure("getSituationSummaryCounts");
  const rows = SITUATION_LIST.filter((r) => !deletedIds.has(r.id));
  const counts: SituationSummaryCounts = {
    total: rows.length,
    intake: 0,
    inProgress: 0,
    draft: 0,
    ready: 0,
  };
  for (const r of rows) {
    switch (r.status) {
      case "intake":
        counts.intake++;
        break;
      case "ready":
        counts.ready++;
        break;
      case "validated":
        counts.draft++;
        break;
      default:
        counts.inProgress++;
    }
  }
  return Promise.resolve(counts);
}

export function getSituation(id: string): Promise<Situation | null> {
  maybeThrowMockFailure("getSituation");
  if (deletedIds.has(id)) return Promise.resolve(null);
  const s = runtimeSituations[id] ?? getSituationDetail(id);
  if (!s) return Promise.resolve(null);
  return Promise.resolve(persist(structuredClone(s)));
}

export function deleteSituation(id: string): Promise<void> {
  maybeThrowMockFailure("deleteSituation");
  deletedIds.add(id);
  delete runtimeSituations[id];
  return Promise.resolve();
}

export async function* streamSituationIntake(
  situationId: string | undefined,
  initialText: string,
  signal?: AbortSignal,
): AsyncGenerator<IntakeEvent> {
  maybeThrowMockFailure("streamIntake");
  const text = initialText.trim() || "Ish beruvchim oyligimni to'lamayapti.";
  for await (const event of streamScriptedIntake(text, signal)) {
    if (event.type === "done") {
      const id = event.situationId;
      const preset = getSituationDetail(id);
      if (preset) {
        runtimeSituations[id] = structuredClone(preset);
      } else {
        ensureSituation(id);
      }
    }
    yield event;
  }
}

export function updateSituationDocument(req: UpdateDocumentRequest): Promise<SituationDocument> {
  maybeThrowMockFailure("updateDocument");
  const s = ensureSituation(req.situationId);
  const idx = s.documents.findIndex((d) => d.id === req.document.id);
  const docs = [...s.documents];
  if (idx >= 0) docs[idx] = req.document;
  else docs.push(req.document);
  persist({ ...s, documents: docs, updatedAt: new Date().toISOString() });
  return Promise.resolve(req.document);
}

export function validateSituationDocument(
  situationId: string,
  documentId: string,
): Promise<ValidationResult> {
  maybeThrowMockFailure("validate");
  const s = ensureSituation(situationId);
  const doc = s.documents.find((d) => d.id === documentId);
  const validation: ValidationResult = doc?.validation ?? {
    canFile: true,
    checks: [{ id: "ok", label: "Asosiy talablar bajarilgan", status: "ok", ground: "[VERIFY]", fix: "" }],
  };
  const docs = s.documents.map((d) =>
    d.id === documentId ? { ...d, validation } : d,
  );
  persist({ ...s, documents: docs });
  return Promise.resolve(validation);
}

export function exportSituationPackage(situationId: string): Promise<ExportResponse> {
  maybeThrowMockFailure("exportPackage");
  const s = ensureSituation(situationId);
  if (!s.readiness.canExport) {
    return Promise.reject(
      new Error("Eksport bloklangan — shoshilinch ogohlantirishlarni hal qiling."),
    );
  }
  return Promise.resolve({
    packageName: `${s.id}-filing-package.zip`,
    packageUrl: `/api/situations/${situationId}/export.zip`,
    pdfUrl: `/api/export/${situationId}.pdf`,
  });
}

export function uploadStub(fileName: string): Promise<UploadResponse> {
  return Promise.resolve({
    fileUrl: `/uploads/stub/${encodeURIComponent(fileName)}`,
    fileName,
  });
}

export function acknowledgeAdvisory(situationId: string, advisoryId: string): Promise<Situation> {
  const s = ensureSituation(situationId);
  const advisories = s.advisories.map((a) =>
    a.id === advisoryId ? { ...a, status: "acknowledged" as const } : a,
  );
  return Promise.resolve(persist({ ...s, advisories }));
}

export { DEMO_SITUATION_ID };
