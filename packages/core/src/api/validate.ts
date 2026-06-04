import { z } from "zod";
import {
  caseDetailSchema,
  caseSchema,
  caseSummaryCountsSchema,
  classificationSchema,
  draftStreamEventSchema,
  exportResponseSchema,
  generatedDocumentSchema,
  legalRouteSchema,
  type Case,
  type CaseDetail,
  type CaseSummaryCounts,
  type Classification,
  type DraftStreamEvent,
  type ExportResponse,
  type GeneratedDocument,
  type LegalRoute,
  type ValidationResult,
  validationResultSchema,
} from "../types/index";

function parse<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Mock ${label} failed zod validation: ${result.error.message}`);
  }
  return result.data as T;
}

export const validate = {
  case: (data: unknown): Case => parse(caseSchema, data, "case"),
  caseDetail: (data: unknown): CaseDetail => parse(caseDetailSchema, data, "caseDetail"),
  caseList: (data: unknown): Case[] => z.array(caseSchema).parse(data),
  classification: (data: unknown): Classification =>
    parse(classificationSchema, data, "classification"),
  document: (data: unknown): GeneratedDocument =>
    parse(generatedDocumentSchema, data, "document"),
  route: (data: unknown): LegalRoute => parse(legalRouteSchema, data, "route"),
  validation: (data: unknown): ValidationResult =>
    parse(validationResultSchema, data, "validation"),
  export: (data: unknown): ExportResponse => parse(exportResponseSchema, data, "export"),
  summaryCounts: (data: unknown): CaseSummaryCounts =>
    parse(caseSummaryCountsSchema, data, "summaryCounts"),
  draftStreamEvent: (data: unknown): DraftStreamEvent =>
    parse(draftStreamEventSchema, data, "draftStreamEvent"),
};
