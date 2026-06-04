export { api, type ApiMode } from "./client";
export {
  DEMO_SITUATION_ID,
  SCENARIO_A_ID,
  SCENARIO_B_ID,
  SCENARIO_C_ID,
  SCENARIO_A_PROMPT,
  SCENARIO_B_PROMPT,
  SCENARIO_C_PROMPT,
} from "./situation-fixtures";
export { persistIntakeSession, deleteCase } from "./mock";
export { armMockFailures, clearMockFailures, isMockFailureError } from "./mock-failure";
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
