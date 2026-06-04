import type { DocSection, DocSectionKind, GeneratedDocument } from "@areeza/core/types";
import { sectionsToPlainText } from "@areeza/core/types";

/** Non-editable legal chrome (court header, title block, demand heading). */
export function isLegalChromeSection(section: DocSection): boolean {
  if (!section.editable) return true;
  if (section.kind === "header" || section.kind === "title") return true;
  if (section.kind === "demand") return true;
  return false;
}

export function sectionPaperClass(kind: DocSectionKind): string {
  switch (kind) {
    case "header":
      return "text-center font-semibold tracking-wide";
    case "title":
      return "text-center font-bold";
    case "party":
      return "legal-mono text-[0.8125rem]";
    case "demand":
      return "font-semibold";
    case "attachments":
      return "text-sm";
    case "footer":
      return "mt-6";
    default:
      return "";
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Highlight unfilled attachment slots. */
export function formatSectionText(text: string): string {
  return text.replace(/____/g, "▁▁▁▁");
}

export function plainTextToHtml(text: string): string {
  const lines = text.split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "<p><br></p>";
      if (
        trimmed === "DA'VO ARIZASI" ||
        trimmed.includes("DA'VO ARIZASI") ||
        trimmed === "SO'RAYMAN:" ||
        trimmed.startsWith("SO'RAYMAN")
      ) {
        return `<h2>${escapeHtml(line)}</h2>`;
      }
      if (line.includes("sudiga") || line.includes("Hisob raqami") || line.includes("STIR")) {
        return `<p class="legal-mono">${escapeHtml(line)}</p>`;
      }
      if (line.includes("____")) {
        return `<p class="legal-slot">${escapeHtml(line)}</p>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("");
}

export function sectionToHtml(section: DocSection): string {
  return plainTextToHtml(section.content);
}

export function sectionsToEditorHtml(sections: DocSection[]): string {
  return sections.map((s) => sectionToHtml(s)).join("");
}

export function mergeSectionsContent(
  sections: DocSection[],
  sectionId: string,
  content: string,
): DocSection[] {
  return sections.map((s) => (s.id === sectionId ? { ...s, content } : s));
}

export function documentWithSections(
  doc: GeneratedDocument,
  sections: DocSection[],
): GeneratedDocument {
  return {
    ...doc,
    sections,
    plainText: sectionsToPlainText(sections),
    version: doc.version + 1,
  };
}

export function resolveDocumentList(
  documents: GeneratedDocument[] | undefined,
  legacy?: GeneratedDocument,
): GeneratedDocument[] {
  if (documents && documents.length > 0) return documents;
  if (legacy) return [legacy];
  return [];
}

export function primaryDocumentId(
  documents: GeneratedDocument[],
  caseId: string,
): string {
  const davo = documents.find((d) => d.kind === "davo_arizasi");
  return davo?.id ?? documents[0]?.id ?? `${caseId}-davo`;
}

export function documentKindLabel(kind: GeneratedDocument["kind"]): string {
  switch (kind) {
    case "davo_arizasi":
      return "Da'vo arizasi";
    case "calculation":
      return "Hisob-kitob";
    case "filing_checklist":
      return "Ro'yxat";
    default:
      return "Hujjat";
  }
}
