import JSZip from "jszip";
import { pdf } from "@react-pdf/renderer";
import type { GeneratedDocument, LegalRoute, ValidationResult } from "@areeza/core/types";
import { DavoArizasiPdf } from "./davo-arizasi-pdf";
import { buildDocxBlob } from "./build-docx";
import { ensurePdfFont } from "./register-pdf-font";
import {
  attachmentPlaceholderBody,
  attachmentPlaceholderEntries,
  buildTopshirishTxt,
} from "./topshirish";
import { safeExportFilename } from "./download";

export type FilingPackageInput = {
  caseTitle: string;
  document: GeneratedDocument;
  documents?: GeneratedDocument[];
  route?: LegalRoute;
  validation?: ValidationResult;
};

export async function buildFilingPackageZip(
  input: FilingPackageInput,
): Promise<{ blob: Blob; filename: string }> {
  await ensurePdfFont();

  const pdfBlob = await pdf(
    <DavoArizasiPdf document={input.document} />,
  ).toBlob();
  const docxBlob = await buildDocxBlob(input.document);

  const extraDocs = input.documents?.filter((d) => d.id !== input.document.id) ?? [];
  const topshirish = buildTopshirishTxt({
    caseTitle: input.caseTitle,
    document: input.document,
    route: input.route,
    validation: input.validation,
    extraDocuments: extraDocs,
  });

  const zip = new JSZip();
  zip.file("Davo_arizasi.pdf", pdfBlob);
  zip.file("Davo_arizasi.docx", docxBlob);
  zip.file("topshirish.txt", topshirish);

  const placeholders = attachmentPlaceholderEntries(input.route);
  for (const path of placeholders) {
    const label = path
      .replace(/^ilovalar\/\d+_/, "")
      .replace(/_PLACEHOLDER\.txt$/, "")
      .replace(/_/g, " ");
    zip.file(path, attachmentPlaceholderBody(label));
  }

  const calc = extraDocs.find((d) => d.kind === "calculation");
  if (calc) {
    zip.file(
      "Hisob_kitob.txt",
      calc.plainText || calc.sections.map((s) => s.content).join("\n\n"),
    );
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const filename = safeExportFilename(input.caseTitle, "zip");

  return { blob: zipBlob, filename };
}

export async function buildPdfBlob(document: GeneratedDocument): Promise<Blob> {
  await ensurePdfFont();
  return pdf(<DavoArizasiPdf document={document} />).toBlob();
}
