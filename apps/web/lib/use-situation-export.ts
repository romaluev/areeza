"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, isMockFailureError } from "@areeza/core/api";
import type { Situation } from "@areeza/core/types";
import { buildSituationPackage } from "@/components/export/build-situation-package";
import { getSituationExportBlockers } from "@/components/export/situation-export-blockers";
import { showRetryToast } from "@/lib/retry-toast";

export function useSituationExport(situationId: string, situation: Situation) {
  const mutation = useMutation({
    mutationFn: async () => {
      if (!situation.readiness.canExport) {
        const blockers = getSituationExportBlockers(situation);
        const summary =
          blockers.length > 0
            ? blockers.map((b) => b.title).join(", ")
            : "Tayyorlik talablari bajarilmagan";
        throw new Error(`blocked:${summary}`);
      }
      await buildSituationPackage(situation);
      return api.exportPackage(situationId);
    },
    onSuccess: () => toast.success("Topshirish paketi yuklab olindi"),
    onError: (err) => {
      const message = (err as Error).message ?? "";
      if (message.startsWith("blocked:")) {
        toast.error("Eksport bloklangan", {
          description: message.slice("blocked:".length),
        });
        return;
      }
      if (isMockFailureError(err)) {
        showRetryToast("Eksport bajarilmadi", () => mutation.mutate());
      } else {
        toast.error("Eksport bajarilmadi");
      }
    },
  });

  return mutation;
}
