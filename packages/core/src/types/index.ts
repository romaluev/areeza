import { z } from "zod";

export const categoryCodeSchema = z.enum([
  "labor.wage_recovery",
  "labor.reinstatement",
  "labor.harassment",
  "debt.recovery",
  "consumer.dispute",
  "family.child_support",
  "family.alimony_enforcement",
  "family.property_division",
  "family.injunction",
  "fraud.investment",
  "fraud.general",
  "criminal.fraud_complaint",
  "criminal.corruption",
  "admin.police_inaction",
  "admin.labor_complaint",
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
  "prosecutor_complaint",
  "admin_complaint",
  "court_order_petition",
  "injunction_petition",
  "calculation",
  "filing_checklist",
]);

export const forumSchema = z.enum([
  "civil_court",
  "prosecutor",
  "anticorruption_agency",
  "labor_inspectorate",
  "admin_authority",
  "family_court",
]);
export type Forum = z.infer<typeof forumSchema>;
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
  issueIds: z.array(z.string()).optional(),
  destination: forumSchema.optional(),
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

/** Full document on a situation aggregate. */
export const situationDocumentSchema = generatedDocumentSchema.extend({
  issueIds: z.array(z.string()),
  destination: forumSchema,
  validation: validationResultSchema.optional(),
});
export type SituationDocument = z.infer<typeof situationDocumentSchema>;

export const issueSeveritySchema = z.enum(["critical", "high", "medium", "low"]);
export type IssueSeverity = z.infer<typeof issueSeveritySchema>;

export const issueSchema = z.object({
  id: z.string(),
  categoryCode: categoryCodeSchema,
  subType: z.string().optional(),
  title: z.string(),
  severity: issueSeveritySchema,
  rationale: z.string(),
  classification: classificationSchema.optional(),
  route: legalRouteSchema.optional(),
  step: pipelineStepSchema,
  status: caseStatusSchema,
});
export type Issue = z.infer<typeof issueSchema>;

export const partyRoleSchema = z.enum([
  "plaintiff",
  "defendant",
  "witness",
  "third_party",
  "accomplice",
]);
export type PartyRole = z.infer<typeof partyRoleSchema>;

export const partyKindSchema = z.enum(["person", "organization", "gov_agency"]);
export type PartyKind = z.infer<typeof partyKindSchema>;

export const partySchema = z.object({
  id: z.string(),
  role: partyRoleSchema,
  kind: partyKindSchema,
  name: z.string(),
  requisites: z.record(z.string()),
  issueIds: z.array(z.string()),
});
export type Party = z.infer<typeof partySchema>;

export const evidenceKindSchema = z.enum([
  "contract",
  "receipt",
  "correspondence",
  "photo",
  "witness_statement",
  "official_record",
  "other",
]);
export type EvidenceKind = z.infer<typeof evidenceKindSchema>;

export const evidenceStatusSchema = z.enum(["pending", "uploaded", "verified"]);
export type EvidenceStatus = z.infer<typeof evidenceStatusSchema>;

export const evidenceItemSchema = z.object({
  id: z.string(),
  kind: evidenceKindSchema,
  title: z.string(),
  fileUrl: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  status: evidenceStatusSchema,
  issueIds: z.array(z.string()),
  documentIds: z.array(z.string()),
});
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const timelineEventKindSchema = z.enum(["fact", "deadline", "manual"]);
export type TimelineEventKind = z.infer<typeof timelineEventKindSchema>;

export const timelineEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  label: z.string(),
  kind: timelineEventKindSchema,
  issueIds: z.array(z.string()),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const advisoryKindSchema = z.enum([
  "deadline_warning",
  "evidence_gap",
  "jurisdiction_alert",
  "strategic_recommendation",
  "human_review_required",
  "compliance_note",
]);
export type AdvisoryKind = z.infer<typeof advisoryKindSchema>;

export const advisorySeveritySchema = z.enum(["urgent", "high", "medium", "info"]);
export type AdvisorySeverity = z.infer<typeof advisorySeveritySchema>;

export const advisoryStatusSchema = z.enum(["open", "acknowledged", "resolved"]);
export type AdvisoryStatus = z.infer<typeof advisoryStatusSchema>;

export const advisorySchema = z.object({
  id: z.string(),
  kind: advisoryKindSchema,
  severity: advisorySeveritySchema,
  title: z.string(),
  body: z.string(),
  status: advisoryStatusSchema,
  issueIds: z.array(z.string()),
  documentIds: z.array(z.string()),
});
export type Advisory = z.infer<typeof advisorySchema>;

export const situationReadinessSchema = z.object({
  documentsReady: z.number().int().nonnegative(),
  documentsTotal: z.number().int().nonnegative(),
  blockingAdvisoryIds: z.array(z.string()),
  canExport: z.boolean(),
});
export type SituationReadiness = z.infer<typeof situationReadinessSchema>;

export const situationStatusSchema = z.enum([
  "draft",
  "intake",
  "in_progress",
  "validated",
  "ready",
]);
export type SituationStatus = z.infer<typeof situationStatusSchema>;

export const nextActionSchema = z.object({
  label: z.string(),
  action: z.string(),
});
export type NextAction = z.infer<typeof nextActionSchema>;

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

export const situationMessageSchema = caseMessageSchema.extend({
  issueId: z.string().optional(),
});
export type SituationMessage = z.infer<typeof situationMessageSchema>;

export const situationSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: situationStatusSchema,
  locale: z.enum(["uz", "ru"]),
  currency: z.string(),
  claimAmount: z.string().optional(),
  activeIssueId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(situationMessageSchema),
  facts: caseFactsSchema,
  issues: z.array(issueSchema),
  parties: z.array(partySchema),
  evidence: z.array(evidenceItemSchema),
  timeline: z.array(timelineEventSchema),
  documents: z.array(situationDocumentSchema),
  advisories: z.array(advisorySchema),
  readiness: situationReadinessSchema,
  statusHistory: z.array(statusEventSchema).optional(),
});
export type Situation = z.infer<typeof situationSchema>;

export const situationSummaryCountsSchema = caseSummaryCountsSchema;
export type SituationSummaryCounts = CaseSummaryCounts;

export const intakeEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("assistant_delta"), delta: z.string() }),
  z.object({
    type: z.literal("question"),
    question: z.string(),
    factKey: z.string().optional(),
    options: z.array(z.string()).optional(),
  }),
  z.object({ type: z.literal("fact"), fact: caseFactSchema }),
  z.object({ type: z.literal("classified"), classification: classificationSchema }),
  z.object({ type: z.literal("issue_identified"), issue: issueSchema }),
  z.object({ type: z.literal("party_added"), party: partySchema }),
  z.object({ type: z.literal("evidence_logged"), evidence: evidenceItemSchema }),
  z.object({ type: z.literal("timeline_event"), event: timelineEventSchema }),
  z.object({ type: z.literal("advisory"), advisory: advisorySchema }),
  z.object({
    type: z.literal("route_proposed"),
    issueId: z.string(),
    route: legalRouteSchema,
  }),
  z.object({ type: z.literal("document_proposed"), document: situationDocumentSchema }),
  z.object({ type: z.literal("next_action"), action: nextActionSchema }),
  z.object({ type: z.literal("active_issue"), issueId: z.string() }),
  z.object({
    type: z.literal("done"),
    situationId: z.string(),
    /** @deprecated */
    caseId: z.string().optional(),
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
  situationId: z.string(),
  documentId: z.string(),
  sectionId: z.string(),
  instruction: z.string().optional(),
});
export type RegenerateSectionRequest = z.infer<typeof regenerateSectionRequestSchema>;

export const updateDocumentRequestSchema = z.object({
  situationId: z.string(),
  document: situationDocumentSchema,
});
export type UpdateDocumentRequest = z.infer<typeof updateDocumentRequestSchema>;

export const exportResponseSchema = z.object({
  pdfUrl: z.string().optional(),
  packageName: z.string(),
  packageUrl: z.string().optional(),
});
export type ExportResponse = z.infer<typeof exportResponseSchema>;

export const uploadResponseSchema = z.object({
  fileUrl: z.string(),
  fileName: z.string(),
});
export type UploadResponse = z.infer<typeof uploadResponseSchema>;

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

export function primaryDocument(
  detail: CaseDetail | Situation,
): GeneratedDocument | SituationDocument | undefined {
  if ("issues" in detail) {
    return (
      detail.documents.find((d) => d.kind === "davo_arizasi") ?? detail.documents[0]
    );
  }
  if (detail.document) return detail.document;
  const docs = detail.documents ?? [];
  return docs.find((d) => d.kind === "davo_arizasi") ?? docs[0];
}

export function sectionsToPlainText(sections: DocSection[]): string {
  return sections.map((s) => s.content).join("\n\n");
}

export function computeReadiness(situation: Situation): SituationReadiness {
  const documentsTotal = situation.documents.length;
  const documentsReady = situation.documents.filter(
    (d) => d.validation?.canFile === true || d.status === "final",
  ).length;
  const blockingAdvisoryIds = situation.advisories
    .filter((a) => a.severity === "urgent" && a.status === "open")
    .map((a) => a.id);
  const canExport =
    documentsTotal > 0 &&
    documentsReady === documentsTotal &&
    blockingAdvisoryIds.length === 0;
  return { documentsReady, documentsTotal, blockingAdvisoryIds, canExport };
}

export function withSituationReadiness(situation: Situation): Situation {
  return { ...situation, readiness: computeReadiness(situation) };
}

export function primaryIssue(situation: Situation): Issue | undefined {
  if (situation.activeIssueId) {
    return situation.issues.find((i) => i.id === situation.activeIssueId);
  }
  return situation.issues[0];
}

export function documentsForIssue(
  situation: Situation,
  issueId: string,
): SituationDocument[] {
  return situation.documents.filter((d) => d.issueIds.includes(issueId));
}

/** Migrate legacy single-issue CaseDetail to a Situation aggregate. */
export function caseDetailToSituation(detail: CaseDetail): Situation {
  const issueId = `issue-${detail.id}`;
  const docs = (detail.documents ?? (detail.document ? [detail.document] : [])).map(
    (doc, i) =>
      ({
        ...doc,
        issueIds: [issueId],
        destination:
          doc.destination ??
          (detail.categoryCode?.startsWith("family") ? "family_court" : "civil_court"),
        validation: detail.validation,
      }) as SituationDocument,
  );

  const issue: Issue = {
    id: issueId,
    categoryCode: detail.categoryCode ?? "other",
    title: detail.title,
    severity: "medium",
    rationale: detail.classification?.trackRationale ?? "",
    classification: detail.classification,
    route: detail.route,
    step: detail.step,
    status: detail.status,
  };

  const situation: Situation = {
    id: detail.id.startsWith("case-") ? detail.id.replace(/^case-/, "situation-") : detail.id,
    title: detail.title,
    status:
      detail.status === "ready"
        ? "ready"
        : detail.status === "intake"
          ? "intake"
          : "in_progress",
    locale: "uz",
    currency: detail.currency,
    claimAmount: detail.claimAmount,
    activeIssueId: issueId,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    messages: detail.messages.map((m) => ({ ...m })),
    facts: detail.facts,
    issues: [issue],
    parties: [],
    evidence: [],
    timeline: [],
    documents: docs,
    advisories: [],
    readiness: {
      documentsReady: 0,
      documentsTotal: docs.length,
      blockingAdvisoryIds: [],
      canExport: false,
    },
    statusHistory: detail.statusHistory,
  };
  return withSituationReadiness(situation);
}

