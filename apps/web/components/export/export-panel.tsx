"use client";

import { useState } from "react";
import { Icon } from "@areeza/ui/icons";
import { toast } from "sonner";
import { Button } from "@areeza/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { api } from "@areeza/core/api";

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
    detail: "Da'vo arizasi, ilovalar va rekvizitlar to'liq bo'lishi kerak.",
  },
  {
    title: "Davlat bojini tekshiring",
    detail: "Mehnat da'volari odatda bojdan ozod — hujjatda asos ko'rsatilgan bo'lishi kerak.",
    url: "https://billing.sud.uz",
  },
];

export function ExportPanel({ caseId }: { caseId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await api.exportPackage(caseId);
      toast.success("Topshiriq paketi tayyor", {
        description: res.packageName,
      });
      window.print();
    } catch {
      toast.error("Yuklab olishda xatolik");
    } finally {
      setLoading(false);
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
        <Button onClick={handleDownload} disabled={loading} className="gap-2">
          <Icon name="download" size="sm" />
          Hujjatlar paketini yuklab olish
        </Button>

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
