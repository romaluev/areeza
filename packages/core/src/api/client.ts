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
import * as real from "./real";

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

export const api = {
  mode: getMode,

  listCases(): Promise<Case[]> {
    return getMode() === "mock" ? mock.listCases() : real.listCases();
  },

  getCaseSummaryCounts(): Promise<CaseSummaryCounts> {
    return getMode() === "mock" ? mock.getCaseSummaryCounts() : real.getCaseSummaryCounts();
  },

  getCase(id: string): Promise<CaseDetail | null> {
    return getMode() === "mock" ? mock.getCase(id) : real.getCase(id);
  },

  deleteCase(id: string): Promise<void> {
    return getMode() === "mock" ? mock.deleteCase(id) : real.deleteCase(id);
  },

  streamIntake(
    caseId: string | undefined,
    initialText: string,
    signal?: AbortSignal,
  ): AsyncGenerator<IntakeEvent> {
    return getMode() === "mock"
      ? mock.streamIntake(caseId, initialText, signal)
      : real.streamIntake(caseId, initialText, signal);
  },

  classify(req: ClassifyRequest): Promise<ClassifyResponse> {
    return getMode() === "mock"
      ? mock.classify(req.text)
      : real.classify(req);
  },

  route(req: RouteRequest, caseId?: string): Promise<LegalRoute> {
    if (getMode() === "mock" && caseId) {
      return mock.applyRoute(caseId, req);
    }
    return getMode() === "mock" ? mock.route(req) : real.route(req, caseId);
  },

  streamDraft(
    caseId: string,
    docId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<DraftStreamEvent> {
    return getMode() === "mock"
      ? mock.streamDraft(caseId, docId, signal)
      : real.streamDraft(caseId, docId, signal);
  },

  regenerateSection(req: RegenerateSectionRequest): Promise<GeneratedDocument> {
    return getMode() === "mock" ? mock.regenerateSection(req) : real.regenerateSection(req);
  },

  updateDocument(req: UpdateDocumentRequest): Promise<GeneratedDocument> {
    return getMode() === "mock" ? mock.updateDocument(req) : real.updateDocument(req);
  },

  draft(caseId: string): Promise<GeneratedDocument> {
    return getMode() === "mock" ? mock.draft(caseId) : real.draft(caseId);
  },

  validate(caseId: string, documentId: string): Promise<ValidationResult> {
    return getMode() === "mock"
      ? mock.validate(caseId, documentId)
      : real.validate(caseId, documentId);
  },

  exportPackage(caseId: string): Promise<ExportResponse> {
    return getMode() === "mock" ? mock.exportPackage(caseId) : real.exportPackage(caseId);
  },
};

export { DEMO_CASE_ID, DEMO_PROMPT_UZ } from "./fixtures";
