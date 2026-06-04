import type { GeneratedDocument } from "@areeza/core/types";
import { sectionsToPlainText } from "@areeza/core/types";

export type ExportReadiness =
  | { ready: true }
  | { ready: false; message: string };

export function getExportReadiness(doc?: GeneratedDocument): ExportReadiness {
  if (!doc) {
    return {
      ready: false,
      message:
        "Hujjat hali tayyorlanmagan. Avval «Hujjatni tayyorlash» tugmasini bosing.",
    };
  }

  if (doc.status === "generating") {
    return {
      ready: false,
      message: "Hujjat hali yozilmoqda. Tayyor bo'lgach yuklab oling.",
    };
  }

  const text = (doc.plainText?.trim() || sectionsToPlainText(doc.sections).trim());
  if (!text || text.length < 80) {
    return {
      ready: false,
      message: "Hujjat matni yetarli emas — bo'sh qismlarni to'ldiring.",
    };
  }

  const hasTitle = doc.sections.some(
    (s) => s.kind === "title" && s.content.trim().length > 0,
  );
  const hasBody = doc.sections.some(
    (s) =>
      (s.kind === "body" || s.kind === "demand") && s.content.trim().length > 0,
  );

  if (!hasTitle || !hasBody) {
    return {
      ready: false,
      message:
        "Hujjat qismlari to'liq emas (sarlavha yoki asosiy matn yo'q).",
    };
  }

  return { ready: true };
}
