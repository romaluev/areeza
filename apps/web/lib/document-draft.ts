import type { GeneratedDocument } from "@areeza/core/types";

export function documentDraftKey(caseId: string, docId: string) {
  return `areeza-doc-draft:${caseId}:${docId}`;
}

export type DocumentDraft = {
  document: GeneratedDocument;
  savedAt: string;
};
