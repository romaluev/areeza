import type {
  Case,
  CaseDetail,
  CaseSummaryCounts,
  ClassifyRequest,
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
import * as mock from "./mock";

export type ApiMode = "mock" | "real";

function getMode(): ApiMode {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_MODE === "real") {
    return "real";
  }
  if (typeof globalThis !== "undefined") {
    const g = globalThis as { __AREEZA_API_MODE__?: ApiMode };
    if (g.__AREEZA_API_MODE__) return g.__AREEZA_API_MODE__;
  }
  return "mock";
}

async function notImplemented(): Promise<never> {
  throw new Error("Real API not wired yet. Set NEXT_PUBLIC_API_MODE=mock.");
}

export const api = {
  mode: getMode,

  listCases(): Promise<Case[]> {
    return getMode() === "mock" ? mock.listCases() : notImplemented();
  },

  getCaseSummaryCounts(): Promise<CaseSummaryCounts> {
    return getMode() === "mock" ? mock.getCaseSummaryCounts() : notImplemented();
  },

  getCase(id: string): Promise<CaseDetail | null> {
    return getMode() === "mock" ? mock.getCase(id) : notImplemented();
  },

  streamIntake(
    caseId: string | undefined,
    initialText: string,
    signal?: AbortSignal,
  ): AsyncGenerator<IntakeEvent> {
    if (getMode() === "mock") {
      return mock.streamIntake(caseId, initialText, signal);
    }
    return (async function* () {
      await notImplemented();
    })();
  },

  classify(req: ClassifyRequest): Promise<ClassifyResponse> {
    return getMode() === "mock" ? mock.classify(req.text) : notImplemented();
  },

  route(req: RouteRequest, caseId?: string): Promise<LegalRoute> {
    if (getMode() === "mock" && caseId) {
      return mock.applyRoute(caseId, req);
    }
    return getMode() === "mock" ? mock.route(req) : notImplemented();
  },

  streamDraft(
    caseId: string,
    docId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<DraftStreamEvent> {
    if (getMode() === "mock") {
      return mock.streamDraft(caseId, docId, signal);
    }
    return (async function* () {
      await notImplemented();
    })();
  },

  regenerateSection(req: RegenerateSectionRequest): Promise<GeneratedDocument> {
    return getMode() === "mock" ? mock.regenerateSection(req) : notImplemented();
  },

  updateDocument(req: UpdateDocumentRequest): Promise<GeneratedDocument> {
    return getMode() === "mock" ? mock.updateDocument(req) : notImplemented();
  },

  draft(caseId: string): Promise<GeneratedDocument> {
    return getMode() === "mock" ? mock.draft(caseId) : notImplemented();
  },

  validate(caseId: string, documentId: string): Promise<ValidationResult> {
    return getMode() === "mock" ? mock.validate(caseId, documentId) : notImplemented();
  },

  exportPackage(caseId: string): Promise<ExportResponse> {
    return getMode() === "mock" ? mock.exportPackage(caseId) : notImplemented();
  },
};

export { DEMO_CASE_ID, DEMO_PROMPT_UZ } from "./fixtures";
