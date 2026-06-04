"use client";

import { useRef, useState } from "react";
import { Icon } from "@areeza/ui/icons";
import { toast } from "sonner";
import { Button } from "@areeza/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { api } from "@areeza/core/api";
import type {
  GeneratedDocument,
  LegalRoute,
  ValidationResult,
} from "@areeza/core/types";
import { downloadBlob, safeExportFilename } from "./download";
import { getExportReadiness } from "./export-readiness";

const FILING_STEPS = [
  {
    title: "my.sud.uz ga kiring",
    detail: "Fuqaro kabineti orqali ishni kuzatish va davlat bojini hisoblash.",
    url: "https://my.sud.uz",
  },
  {
    title: "cabinet.sud.uz da autentifikatsiya",
    detail: "Elektron imzo yoki ID orqali shaxsni tasdiqlang (talablar o'zgarishi mumkin).",
    url: "https://cabinet.sud.uz",
  },
  {
    title: "Hujjatlar paketini yuklang",
    detail: "Da'vo arizasi (PDF + DOCX), topshirish.txt va ilova joylari.",
  },
  {
    title: "Davlat bojini tekshiring",
    detail: "Mehnat da'volari odatda bojdan ozod — hujjatda asos ko'rsatilgan bo'lishi kerak.",
    url: "https://billing.sud.uz",
  },
];

type BusyKind = "package" | "pdf" | "docx" | "print" | null;

export function ExportPanel({
  caseId,
  caseTitle,
  document,
  documents,
  route,
  validation,
}: {
  caseId: string;
  caseTitle: string;
  document?: GeneratedDocument;
  documents?: GeneratedDocument[];
  route?: LegalRoute;
  validation?: ValidationResult;
}) {
  const readiness = getExportReadiness(document);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState<BusyKind>(null);

  const disabled = !readiness.ready || busy !== null;

  async function withGuard(kind: BusyKind, work: () => Promise<void>) {
    if (!readiness.ready || busyRef.current) return;
    busyRef.current = true;
    setBusy(kind);
    try {
      await work();
    } catch {
      toast.error("Yuklab olishda xatolik", {
        description: "Brauzer bloklagan bo'lishi mumkin — «Chop etish» ni sinab ko'ring.",
      });
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  async function handlePackage() {
    await withGuard("package", async () => {
      const { buildFilingPackageZip } = await import("./build-package");
      const { blob, filename } = await buildFilingPackageZip({
        caseTitle,
        document: document!,
        documents,
        route,
        validation,
      });
      const ok = downloadBlob(blob, filename);
      if (!ok) {
        toast.warning("Yuklab olish bloklandi", {
          description: "Chop etish tugmasi orqali PDF olish mumkin.",
        });
        return;
      }
      try {
        const res = await api.exportPackage(caseId);
        toast.success("Topshiriq paketi yuklandi", {
          description: res.packageName ?? filename,
        });
      } catch {
        toast.success("Topshiriq paketi yuklandi", { description: filename });
      }
    });
  }

  async function handlePdf() {
    await withGuard("pdf", async () => {
      const { buildPdfBlob } = await import("./build-package");
      const blob = await buildPdfBlob(document!);
      const name = safeExportFilename(caseTitle, "pdf");
      if (!downloadBlob(blob, name)) {
        toast.warning("PDF yuklab bo'lmadi — chop etishni sinang.");
      } else {
        toast.success("PDF tayyor", { description: name });
      }
    });
  }

  async function handleDocx() {
    await withGuard("docx", async () => {
      const { buildDocxBlob } = await import("./build-docx");
      const blob = await buildDocxBlob(document!);
      const name = safeExportFilename(caseTitle, "docx");
      if (!downloadBlob(blob, name)) {
        toast.warning("DOCX yuklab bo'lmadi.");
      } else {
        toast.success("Word hujjati tayyor", { description: name });
      }
    });
  }

  function handlePrint() {
    if (!readiness.ready) return;
    if (busyRef.current) return;
    setBusy("print");
    try {
      window.print();
    } finally {
      window.setTimeout(() => setBusy(null), 400);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon name="fileCheck" size="sm" className="text-[var(--primary)]" />
          Topshiriq paketi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readiness.ready ? (
          <p className="rounded-lg border border-[var(--warn)]/30 bg-[var(--warn)]/10 px-3 py-2 text-sm text-[var(--foreground)]">
            {readiness.message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handlePackage}
            disabled={disabled}
            className="gap-2"
          >
            <Icon name="download" size="sm" />
            {busy === "package" ? "Tayyorlanmoqda…" : "Paketni yuklab olish (ZIP)"}
          </Button>
          <Button
            variant="outline"
            onClick={handlePdf}
            disabled={disabled}
            className="gap-2"
          >
            <Icon name="file" size="sm" />
            {busy === "pdf" ? "PDF…" : "PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDocx}
            disabled={disabled}
            className="gap-2"
          >
            <Icon name="file" size="sm" />
            {busy === "docx" ? "DOCX…" : "DOCX"}
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!readiness.ready || busy === "package" || busy === "pdf" || busy === "docx"}
            className="gap-2"
          >
            <Icon name="printer" size="sm" />
            Chop etish
          </Button>
        </div>

        <p className="text-[11px] text-[var(--muted-foreground)]">
          ZIP: PDF + Word + topshirish.txt + ilova joylari. Brauzer bloklasa — «Hujjat»
          yorlig&apos;idagi chop etish yoki PDF alohida.
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium">E-sud orqali topshirish</p>
          <ol className="space-y-3">
            {FILING_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)]">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-[var(--muted-foreground)]">{step.detail}</p>
                  {step.url ? (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                    >
                      {step.url}
                      <Icon name="externalLink" size={12} />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
