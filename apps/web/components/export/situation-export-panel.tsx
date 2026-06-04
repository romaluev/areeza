"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@areeza/ui/components/button";
import { api, isMockFailureError } from "@areeza/core/api";
import type { Situation } from "@areeza/core/types";
import { buildSituationPackage } from "./build-situation-package";
import { showRetryToast } from "@/lib/retry-toast";

const FORUM_GUIDES: Record<string, string> = {
  civil_court: "my.sud.uz / cabinet.sud.uz — fuqarolik sudi",
  prosecutor: "prokuratura.uz — jinoiy ariza",
  anticorruption_agency: "anticorruption.uz — korrupsiya",
  labor_inspectorate: "mehnat.uz — mehnat inspeksiyasi",
  family_court: "my.sud.uz — oila / aliment",
  admin_authority: "Tegishli organ yoki prokuratura",
};

export function SituationExportPanel({
  situation,
  situationId,
}: {
  situation: Situation;
  situationId: string;
}) {
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!situation.readiness.canExport) {
        throw new Error("blocked");
      }
      await buildSituationPackage(situation);
      return api.exportPackage(situationId);
    },
    onSuccess: () => toast.success("Topshirish paketi yuklab olindi"),
    onError: (err) => {
      if ((err as Error).message === "blocked") {
        toast.error("Shoshilinch ogohlantirishlarni hal qiling");
        return;
      }
      if (isMockFailureError(err)) {
        showRetryToast("Eksport bajarilmadi", () => exportMutation.mutate());
      } else {
        toast.error("Eksport bajarilmadi");
      }
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Paket: {situation.documents.length} ta PDF, dalillar ro&apos;yxati, har bir forum
        uchun topshirish yo&apos;riqnomasi.
      </p>
      <ul className="space-y-2 text-sm">
        {situation.documents.map((d) => (
          <li key={d.id} className="rounded-lg border border-border px-3 py-2">
            <span className="font-medium">{d.title}</span>
            <span className="text-muted"> → {FORUM_GUIDES[d.destination] ?? d.destination}</span>
          </li>
        ))}
      </ul>
      {!situation.readiness.canExport ? (
        <p className="text-sm text-danger">
          Eksport bloklangan: barcha hujjatlar tayyor bo&apos;lishi va shoshilinch
          ogohlantirishlar hal qilinishi kerak.
        </p>
      ) : null}
      <Button
        type="button"
        disabled={!situation.readiness.canExport || exportMutation.isPending}
        onClick={() => exportMutation.mutate()}
      >
        ZIP yuklab olish
      </Button>
    </div>
  );
}
