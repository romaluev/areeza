import { z } from "zod";

export const categoryCodeSchema = z.enum([
  "labor.wage_recovery",
  "labor.reinstatement",
  "debt.recovery",
  "consumer.dispute",
  "family.child_support",
  "other",
]);
export type CategoryCode = z.infer<typeof categoryCodeSchema>;

export const trackSchema = z.enum(["court_order", "claim"]);
export type Track = z.infer<typeof trackSchema>;

export const caseStatusSchema = z.enum([
  "draft",
  "intake",
  "classified",
  "routed",
  "drafted",
  "validated",
  "ready",
]);
export type CaseStatus = z.infer<typeof caseStatusSchema>;

export const pipelineStepSchema = z.enum([
  "describe",
  "classify",
  "route",
  "prepare",
  "validate",
  "submit",
]);
export type PipelineStep = z.infer<typeof pipelineStepSchema>;

/** Plain-language timeline entry for case tracking (Wave 1C). */
export const statusEventSchema = z.object({
  step: pipelineStepSchema,
  label: z.string(),
  at: z.string(),
  note: z.string().optional(),
});
export type StatusEvent = z.infer<typeof statusEventSchema>;

export const confidenceLevelSchema = z.enum(["high", "medium", "low"]);
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;

export const classificationSchema = z.object({
  categoryCode: categoryCodeSchema,
  label: z.string(),
  /** Numeric score 0–1 (display / legacy). */
  confidence: z.number().min(0).max(1),
  /** UX bucket for intake/workspace (high → proceed, low → picker). */
  confidenceLevel: confidenceLevelSchema,
  track: trackSchema,
  trackLabel: z.string(),
  trackRationale: z.string(),
  needsCategoryPick: z.boolean().optional(),
  clarifyingQuestion: z.string().optional(),
});
export type Classification = z.infer<typeof classificationSchema>;

export const caseFactStatusSchema = z.enum(["collected", "missing", "optional"]);
export type CaseFactStatus = z.infer<typeof caseFactStatusSchema>;

export const caseFactSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  status: caseFactStatusSchema,
  group: z.string().optional(),
});
export type CaseFact = z.infer<typeof caseFactSchema>;

export const caseFactsSchema = z.array(caseFactSchema);
export type CaseFacts = z.infer<typeof caseFactsSchema>;

export const legalRouteSchema = z.object({
  court: z.string(),
  applicationType: z.string(),
  feeNote: z.string(),
  limitation: z.string(),
  legalBasis: z.array(z.string()),
  requiredDocuments: z.array(z.string()),
});
export type LegalRoute = z.infer<typeof legalRouteSchema>;

export const docSectionKindSchema = z.enum([
  "header",
  "party",
  "title",
  "body",
  "demand",
  "attachments",
  "footer",
  "calculation",
  "checklist",
]);
export type DocSectionKind = z.infer<typeof docSectionKindSchema>;

/** Section unit for streaming generation + guarded editing. */
export const docSectionSchema = z.object({
  id: z.string(),
  kind: docSectionKindSchema,
  content: z.string(),
  editable: z.boolean(),
});
export type DocSection = z.infer<typeof docSectionSchema>;

/** @deprecated Use DocSection */
export const documentSectionSchema = docSectionSchema.omit({ editable: true }).extend({
  editable: z.boolean().optional(),
});
export type DocumentSection = z.infer<typeof documentSectionSchema>;

export const documentKindSchema = z.enum([
  "davo_arizasi",
  "calculation",
  "filing_checklist",
]);
export type DocumentKind = z.infer<typeof documentKindSchema>;

export const documentStatusSchema = z.enum(["generating", "draft", "final"]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const generatedDocumentSchema = z.object({
  id: z.string(),
  kind: documentKindSchema,
  title: z.string(),
  claimAmount: z.string().optional(),
  sections: z.array(docSectionSchema),
  plainText: z.string(),
  version: z.number().int().positive(),
  status: documentStatusSchema,
});
export type GeneratedDocument = z.infer<typeof generatedDocumentSchema>;

export const validationStatusSchema = z.enum(["ok", "warn", "fail"]);
export type ValidationStatus = z.infer<typeof validationStatusSchema>;

export const validationCheckSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: validationStatusSchema,
  ground: z.string(),
  fix: z.string(),
});
export type ValidationCheck = z.infer<typeof validationCheckSchema>;

export const validationResultSchema = z.object({
  checks: z.array(validationCheckSchema),
  canFile: z.boolean(),
});
export type ValidationResult = z.infer<typeof validationResultSchema>;

export const caseSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: caseStatusSchema,
  step: pipelineStepSchema,
  categoryCode: categoryCodeSchema.optional(),
  claimAmount: z.string().optional(),
  currency: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Case = z.infer<typeof caseSchema>;

/** Light counts for the cases home summary strip. */
export const caseSummaryCountsSchema = z.object({
  total: z.number().int().nonnegative(),
  intake: z.number().int().nonnegative(),
  inProgress: z.number().int().nonnegative(),
  draft: z.number().int().nonnegative(),
  ready: z.number().int().nonnegative(),
});
export type CaseSummaryCounts = z.infer<typeof caseSummaryCountsSchema>;

export const caseMessageRoleSchema = z.enum(["user", "assistant", "system"]);
export type CaseMessageRole = z.infer<typeof caseMessageRoleSchema>;

export const caseMessageSchema = z.object({
  id: z.string(),
  role: caseMessageRoleSchema,
  content: z.string(),
  createdAt: z.string(),
});
export type CaseMessage = z.infer<typeof caseMessageSchema>;

export const intakeEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("assistant_delta"),
    delta: z.string(),
  }),
  z.object({
    type: z.literal("question"),
    question: z.string(),
    factKey: z.string().optional(),
  }),
  z.object({
    type: z.literal("fact"),
    fact: caseFactSchema,
  }),
  z.object({
    type: z.literal("classified"),
    classification: classificationSchema,
  }),
  z.object({
    type: z.literal("done"),
    caseId: z.string(),
  }),
]);
export type IntakeEvent = z.infer<typeof intakeEventSchema>;

export const caseDetailSchema = caseSchema.extend({
  messages: z.array(caseMessageSchema),
  facts: caseFactsSchema,
  classification: classificationSchema.optional(),
  route: legalRouteSchema.optional(),
  /** Primary court filing document (first `davo_arizasi` when present). */
  document: generatedDocumentSchema.optional(),
  documents: z.array(generatedDocumentSchema).optional(),
  statusHistory: z.array(statusEventSchema).optional(),
  validation: validationResultSchema.optional(),
});
export type CaseDetail = z.infer<typeof caseDetailSchema>;

export const classifyRequestSchema = z.object({
  caseId: z.string().optional(),
  text: z.string(),
});
export type ClassifyRequest = z.infer<typeof classifyRequestSchema>;

export const classifyResponseSchema = classificationSchema;
export type ClassifyResponse = z.infer<typeof classifyResponseSchema>;

export const routeRequestSchema = z.object({
  categoryCode: categoryCodeSchema,
  facts: caseFactsSchema,
});
export type RouteRequest = z.infer<typeof routeRequestSchema>;

export const exportResponseSchema = z.object({
  pdfUrl: z.string(),
  packageName: z.string(),
});
export type ExportResponse = z.infer<typeof exportResponseSchema>;

export const draftStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("section_start"),
    sectionId: z.string(),
    kind: docSectionKindSchema,
  }),
  z.object({
    type: z.literal("chunk"),
    sectionId: z.string(),
    delta: z.string(),
  }),
  z.object({
    type: z.literal("section_done"),
    sectionId: z.string(),
    content: z.string(),
  }),
  z.object({
    type: z.literal("done"),
    document: generatedDocumentSchema,
  }),
]);
export type DraftStreamEvent = z.infer<typeof draftStreamEventSchema>;

export const regenerateSectionRequestSchema = z.object({
  caseId: z.string(),
  documentId: z.string(),
  sectionId: z.string(),
  instruction: z.string().optional(),
});
export type RegenerateSectionRequest = z.infer<typeof regenerateSectionRequestSchema>;

export const updateDocumentRequestSchema = z.object({
  caseId: z.string(),
  document: generatedDocumentSchema,
});
export type UpdateDocumentRequest = z.infer<typeof updateDocumentRequestSchema>;

/** Map numeric classifier score to UX confidence bucket. */
export function confidenceLevelFromScore(score: number): ConfidenceLevel {
  if (score >= 0.8) return "high";
  if (score >= 0.55) return "medium";
  return "low";
}

export function withConfidenceLevel(
  partial: Omit<Classification, "confidenceLevel"> & { confidence: number },
): Classification {
  const confidenceLevel = confidenceLevelFromScore(partial.confidence);
  return {
    ...partial,
    confidenceLevel,
    needsCategoryPick:
      partial.needsCategoryPick ?? (confidenceLevel === "low" || partial.categoryCode === "other"),
  };
}

export function primaryDocument(detail: CaseDetail): GeneratedDocument | undefined {
  if (detail.document) return detail.document;
  const docs = detail.documents ?? [];
  return docs.find((d) => d.kind === "davo_arizasi") ?? docs[0];
}

export function sectionsToPlainText(sections: DocSection[]): string {
  return sections.map((s) => s.content).join("\n\n");
}
