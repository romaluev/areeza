import type { GeneratedDocument, LegalRoute, ValidationResult } from "@areeza/core/types";
import { sectionsToPlainText } from "@areeza/core/types";

const FILING_STEPS = [
  "1. my.sud.uz — fuqaro kabineti (ishni kuzatish, davlat boji)",
  "2. cabinet.sud.uz — elektron imzo yoki ID bilan autentifikatsiya",
  "3. Hujjatlar paketini yuklang (da'vo arizasi, ilovalar, rekvizitlar)",
  "4. billing.sud.uz — davlat bojini tekshiring (mehnat da'volari ko'pincha ozod)",
];

export function buildTopshirishTxt(opts: {
  caseTitle: string;
  document: GeneratedDocument;
  route?: LegalRoute;
  validation?: ValidationResult;
  extraDocuments?: GeneratedDocument[];
}): string {
  const lines: string[] = [
    "AREEZA — SUDGA TOPSHIRISH YO'RIQNOMASI",
    "=====================================",
    "",
    `Ish: ${opts.caseTitle}`,
    `Asosiy hujjat: ${opts.document.title}`,
    `Da'vo bahosi: ${opts.document.claimAmount ?? "—"}`,
    "",
    "E-SUD ORQALI TOPSHIRISH TARTIBI",
    "------------------------------",
    ...FILING_STEPS,
    "",
  ];

  if (opts.route) {
    lines.push("MARSHRUT MA'LUMOTLARI", "--------------------");
    lines.push(`Sud: ${opts.route.court}`);
    lines.push(`Ariza turi: ${opts.route.applicationType}`);
    lines.push(`Muddat: ${opts.route.limitation}`);
    lines.push(`Boj: ${opts.route.feeNote}`);
    lines.push("");
    lines.push("TALAB QILINADIGAN HUJJATLAR");
    opts.route.requiredDocuments.forEach((doc, i) => {
      lines.push(`  ${i + 1}. ${doc}`);
    });
    lines.push("");
  }

  if (opts.validation) {
    lines.push("TEKSHIRUV NATIJASI");
    lines.push(
      opts.validation.canFile
        ? "  ✓ Hujjat topshirishga tayyor deb baholandi."
        : "  ! Ba'zi bandlar to'g'rilanishi kerak — Areeza tekshiruv panelini ko'ring.",
    );
    opts.validation.checks.forEach((c) => {
      const mark = c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "✗";
      lines.push(`  ${mark} ${c.label}`);
      if (c.status !== "ok" && c.fix) lines.push(`      → ${c.fix}`);
    });
    lines.push("");
  }

  const checklist = opts.extraDocuments?.find((d) => d.kind === "filing_checklist");
  if (checklist) {
    lines.push("TOPSHIRISH RO'YXATI (hujjatdan)");
    lines.push(sectionsToPlainText(checklist.sections));
    lines.push("");
  }

  lines.push(
    "PAKET TARKIBI",
    "-------------",
    "  • Davo_arizasi.pdf — sud uchun chop etishga tayyor",
    "  • Davo_arizasi.docx — tahrirlash uchun Word nusxasi",
    "  • ilovalar/ — qo'shimcha hujjatlar uchun joy (placeholder)",
    "",
    "ESLATMA: Areeza yuridik maslahat bermaydi. Topshirish qarori fuqaroning o'zida.",
  );

  return lines.join("\n");
}

export function attachmentPlaceholderEntries(route?: LegalRoute): string[] {
  const fromRoute = route?.requiredDocuments ?? [];
  const fromIlova = [
    "Mehnat shartnomasi",
    "Ish haqi hisob-kitobi",
    "Ishga qabul buyrug'i",
    "O'rtacha ish haqi ma'lumotnomasi",
  ];
  const merged = [...new Set([...fromRoute, ...fromIlova])];
  return merged.map((label, i) => {
    const slug = label
      .replace(/[^a-zA-Z0-9\u0400-\u04FF']/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 40);
    return `ilovalar/${String(i + 1).padStart(2, "0")}_${slug}_PLACEHOLDER.txt`;
  });
}

export function attachmentPlaceholderBody(label: string): string {
  return [
    "AREEZA — ILOVA JOYI (PLACEHOLDER)",
    "",
    `Kerakli hujjat: ${label}`,
    "",
    "Ushbu faylni o'z hujjatingiz bilan almashtiring (PDF yoki skaner nusxasi).",
    "Sudga topshirishdan oldin ro'yxatni topshirish.txt faylida tekshiring.",
  ].join("\n");
}
