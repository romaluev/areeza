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
  PipelineStep,
  RegenerateSectionRequest,
  RouteRequest,
  Situation,
  SituationSummaryCounts,
  UpdateDocumentRequest,
  UploadResponse,
  ValidationResult,
} from "../types/index";
import { caseIdToSituationId } from "./situation-fixtures";
import * as mock from "./mock";
import * as mockSituation from "./mock-situation";
import * as real from "./real";

export type ApiMode = "mock" | "real";

function getMode(): ApiMode {
  // Explicit override (env or runtime global) wins; otherwise default to the real
  // backend. Set NEXT_PUBLIC_API_MODE=mock to use the canned demo data.
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_MODE === "mock") {
    return "mock";
  }
  if (typeof globalThis !== "undefined") {
    const g = globalThis as { __AREEZA_API_MODE__?: ApiMode };
    if (g.__AREEZA_API_MODE__) return g.__AREEZA_API_MODE__;
  }
  return "real";
}

export const api = {
  mode: getMode,

  listSituations(): Promise<Situation[]> {
    return getMode() === "mock" ? mockSituation.listSituations() : real.listSituations();
  },

  getSituationSummaryCounts(): Promise<SituationSummaryCounts> {
    return getMode() === "mock"
      ? mockSituation.getSituationSummaryCounts()
      : real.getSituationSummaryCounts();
  },

  getSituation(id: string): Promise<Situation | null> {
    return getMode() === "mock" ? mockSituation.getSituation(id) : real.getSituation(id);
  },

  deleteSituation(id: string): Promise<void> {
    return getMode() === "mock" ? mockSituation.deleteSituation(id) : real.deleteSituation(id);
  },

  /** Kanban drag: move an issue to a new pipeline step (+ optional manual order). */
  moveIssue(
    situationId: string,
    issueId: string,
    step: PipelineStep,
    position?: number,
  ): Promise<Situation> {
    return getMode() === "mock"
      ? mockSituation.moveIssue(situationId, issueId, step, position)
      : real.moveIssue(situationId, issueId, step, position);
  },

  streamIntake(
    situationId: string | undefined,
    initialText: string,
    signal?: AbortSignal,
  ): AsyncGenerator<IntakeEvent> {
    return getMode() === "mock"
      ? mockSituation.streamSituationIntake(situationId, initialText, signal)
      : real.streamIntake(situationId, initialText, signal);
  },

  acknowledgeAdvisory(situationId: string, advisoryId: string): Promise<Situation> {
    return getMode() === "mock"
      ? mockSituation.acknowledgeAdvisory(situationId, advisoryId)
      : mockSituation.acknowledgeAdvisory(situationId, advisoryId);
  },

  uploadFile(fileName: string): Promise<UploadResponse> {
    return getMode() === "mock" ? mockSituation.uploadStub(fileName) : mockSituation.uploadStub(fileName);
  },

  classify(req: ClassifyRequest): Promise<ClassifyResponse> {
    return getMode() === "mock" ? mock.classify(req.text) : real.classify(req);
  },

  route(req: RouteRequest, situationId?: string): Promise<LegalRoute> {
    if (getMode() === "mock" && situationId) {
      return mock.applyRoute(caseIdToSituationId(situationId), req);
    }
    return getMode() === "mock" ? mock.route(req) : real.route(req, situationId);
  },

  streamDraft(
    situationId: string,
    docId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<DraftStreamEvent> {
    return getMode() === "mock"
      ? mock.streamDraft(caseIdToSituationId(situationId), docId, signal)
      : real.streamDraft(situationId, docId, signal);
  },

  regenerateSection(req: RegenerateSectionRequest): Promise<GeneratedDocument> {
    return getMode() === "mock" ? mock.regenerateSection(req) : real.regenerateSection(req);
  },

  updateDocument(req: UpdateDocumentRequest): Promise<GeneratedDocument> {
    return getMode() === "mock"
      ? mockSituation.updateSituationDocument(req)
      : real.updateDocument(req);
  },

  draft(situationId: string): Promise<GeneratedDocument> {
    return getMode() === "mock" ? mock.draft(caseIdToSituationId(situationId)) : real.draft(situationId);
  },

  validate(situationId: string, documentId: string): Promise<ValidationResult> {
    return getMode() === "mock"
      ? mockSituation.validateSituationDocument(situationId, documentId)
      : real.validate(situationId, documentId);
  },

  exportPackage(situationId: string): Promise<ExportResponse> {
    return getMode() === "mock"
      ? mockSituation.exportSituationPackage(situationId)
      : real.exportPackage(situationId);
  },

  /** @deprecated Use listSituations */
  listCases(): Promise<Case[]> {
    return this.listSituations().then((rows) =>
      rows.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status === "in_progress" ? "classified" : (s.status as Case["status"]),
        step: s.issues[0]?.step ?? "describe",
        categoryCode: s.issues[0]?.categoryCode,
        claimAmount: s.claimAmount,
        currency: s.currency,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    );
  },

  getCaseSummaryCounts(): Promise<CaseSummaryCounts> {
    return this.getSituationSummaryCounts();
  },

  getCase(id: string): Promise<CaseDetail | null> {
    return this.getSituation(caseIdToSituationId(id)).then((s) => {
      if (!s) return null;
      const issue = s.issues[0];
      return {
        id: s.id,
        title: s.title,
        status: issue?.status ?? "intake",
        step: issue?.step ?? "describe",
        categoryCode: issue?.categoryCode,
        claimAmount: s.claimAmount,
        currency: s.currency,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messages: s.messages,
        facts: s.facts,
        classification: issue?.classification,
        route: issue?.route,
        documents: s.documents,
        document: s.documents[0],
        validation: s.documents[0]?.validation,
        statusHistory: s.statusHistory,
      };
    });
  },

  deleteCase(id: string): Promise<void> {
    return this.deleteSituation(caseIdToSituationId(id));
  },
};

export {
  DEMO_SITUATION_ID,
  SCENARIO_A_ID,
  SCENARIO_B_ID,
  SCENARIO_C_ID,
  SCENARIO_A_PROMPT,
  SCENARIO_B_PROMPT,
  SCENARIO_C_PROMPT,
} from "./situation-fixtures";
export { DEMO_CASE_ID, DEMO_PROMPT_UZ } from "./fixtures";
