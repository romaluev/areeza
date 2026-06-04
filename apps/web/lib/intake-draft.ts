import type { CaseFact, CaseMessage, Classification } from "@areeza/core/types";

export const INTAKE_DRAFT_KEY = "areeza-intake-draft";

export type IntakeDraft = {
  locale: "uz" | "ru";
  messages: CaseMessage[];
  facts: CaseFact[];
  classification: Classification | null;
  input: string;
  pendingCaseId: string | null;
  savedAt: string;
};
