import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { DocSection, GeneratedDocument } from "@areeza/core/types";
import { sectionsToPlainText } from "@areeza/core/types";

/** Half-points: 11pt body → 22 */
const BODY_HALF = 22;
const TITLE_HALF = 26;
const HEADER_HALF = 24;

function sectionParagraphs(section: DocSection): Paragraph[] {
  const lines = section.content.split("\n");
  const runsForLine = (line: string, bold?: boolean) =>
    new TextRun({
      text: line || " ",
      size: BODY_HALF,
      bold: bold ?? false,
      font: "Times New Roman",
    });

  if (section.kind === "header") {
    return lines.map(
      (line) =>
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: line,
              size: HEADER_HALF,
              font: "Times New Roman",
            }),
          ],
        }),
    );
  }

  if (section.kind === "title") {
    return lines.map((line, i) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: i === 0 ? HeadingLevel.HEADING_1 : undefined,
        spacing: { before: i === 0 ? 200 : 80, after: 80 },
        children: [
          new TextRun({
            text: line,
            size: TITLE_HALF,
            bold: true,
            font: "Times New Roman",
          }),
        ],
      }),
    );
  }

  if (section.kind === "demand") {
    return lines.map((line, i) =>
      new Paragraph({
        spacing: { before: i === 0 ? 160 : 60, after: 60 },
        children: [runsForLine(line, i === 0 || line.startsWith("SO'RAY"))],
      }),
    );
  }

  if (section.kind === "party") {
    return lines.map((line) =>
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: line,
            size: BODY_HALF,
            font: line.includes("STIR") || line.includes("Hisob") ? "Courier New" : "Times New Roman",
          }),
        ],
      }),
    );
  }

  return lines.map((line) =>
    new Paragraph({
      spacing: { after: 60 },
      children: [runsForLine(line)],
    }),
  );
}

export async function buildDocxBlob(document: GeneratedDocument): Promise<Blob> {
  const sections =
    document.sections.length > 0
      ? document.sections
      : [
          {
            id: "plain",
            kind: "body" as const,
            content: document.plainText || sectionsToPlainText([]),
            editable: false,
          },
        ];

  const children = sections.flatMap((s) => sectionParagraphs(s));

  const doc = new Document({
    title: document.title,
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}
