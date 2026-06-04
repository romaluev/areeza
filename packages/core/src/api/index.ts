export { api, type ApiMode } from "./client";
export { persistIntakeSession } from "./mock";
export {
  DEMO_CASE_ID,
  DEMO_PROMPT_UZ,
  DEMO_CASE_DETAIL,
  DEMO_DOCUMENT,
  DEMO_DOCUMENTS,
  CASE_LIST,
  getCaseDetail,
  getDocumentTemplate,
  normalizeCaseDetail,
} from "./fixtures";
export {
  confidenceLevelFromScore,
  withConfidenceLevel,
  primaryDocument,
  sectionsToPlainText,
} from "../types/index";
export type {
  StatusEvent,
  DocSection,
  ConfidenceLevel,
  CaseSummaryCounts,
  DraftStreamEvent,
  RegenerateSectionRequest,
  UpdateDocumentRequest,
  DocumentKind,
  DocumentStatus,
} from "../types/index";
