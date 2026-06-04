import JSZip from "jszip";
import { pdf } from "@react-pdf/renderer";
import type { Situation } from "@areeza/core/types";
import { DavoArizasiPdf } from "./davo-arizasi-pdf";
import { LegalDocumentPdf } from "./legal-document-pdf";
import { downloadBlob } from "./download";

const FORUM_GUIDES: Record<string, string> = {
  civil_court: "1. my.sud.uz da sud tanlang\n2. cabinet.sud.uz orqali elektron topshiring\n3. Davlat boji kalkulyatorini tekshiring",
  prosecutor: "1. prokuratura.uz yoki shaxsiy qabul\n2. Ariza + ilovalar nusxasi\n3. [VERIFY] joriy talablar",
  anticorruption_agency: "1. anticorruption.uz portali\n2. Korrupsiya haqida ariza shakli\n3. [VERIFY]",
  labor_inspectorate: "1. Hududiy mehnat inspeksiyasi\n2. Ariza + dalillar\n3. [VERIFY]",
  family_court: "1. my.sud.uz — oila / fuqarolik sudi\n2. Aliment yoki mulk bo'yicha ariza\n3. [VERIFY]",
  admin_authority: "1. Tegishli organ yoki prokuratura\n2. Ma'muriy shikoyat\n3. [VERIFY]",
};

export async function buildSituationPackage(situation: Situation): Promise<void> {
  const zip = new JSZip();
  const cover = [
    "AREEZA — Topshirish paketi",
    `Holat: ${situation.title}`,
    "",
    "Hujjatlar:",
    ...situation.documents.map(
      (d, i) => `${i + 1}. ${d.title} → ${d.destination}`,
    ),
    "",
    "Eslatma: bu maslahat emas; yakuniy qaror inson va organlarda.",
  ].join("\n");
  zip.file("muqova.txt", cover);

  for (const d of situation.documents) {
    const DocComponent =
      d.kind === "davo_arizasi" ? DavoArizasiPdf : LegalDocumentPdf;
    const blob = await pdf(<DocComponent document={d} />).toBlob();
    zip.file(`${d.id}.pdf`, blob);
    const guide = FORUM_GUIDES[d.destination] ?? d.destination;
    zip.file(`yo'riqnoma-${d.id}.txt`, `Topshirish: ${d.title}\nForum: ${d.destination}\n\n${guide}`);
  }

  if (situation.evidence.length > 0) {
    zip.file(
      "dalillar.txt",
      situation.evidence.map((e) => `- ${e.title} (${e.fileUrl ?? "fayl yo'q"})`).join("\n"),
    );
  }

  const out = await zip.generateAsync({ type: "blob" });
  downloadBlob(out, `${situation.id}-filing-package.zip`);
}
