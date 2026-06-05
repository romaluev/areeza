"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@areeza/core/api";
import type { PipelineStep, Situation } from "@areeza/core/types";

type MoveVars = {
  issueId: string;
  situationId: string;
  step: PipelineStep;
  position: number;
};

/**
 * Optimistically move an issue to a new pipeline stage on the kanban board.
 * Updates the cached `["situations"]` list immediately, rolls back on error,
 * and revalidates the list + the affected situation on settle.
 */
export function useMoveIssue() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ situationId, issueId, step, position }: MoveVars) =>
      api.moveIssue(situationId, issueId, step, position),

    onMutate: async ({ issueId, situationId, step, position }: MoveVars) => {
      await qc.cancelQueries({ queryKey: ["situations"] });
      const previous = qc.getQueryData<Situation[]>(["situations"]);
      qc.setQueryData<Situation[]>(["situations"], (rows) =>
        rows?.map((s) =>
          s.id === situationId
            ? {
                ...s,
                issues: s.issues.map((i) =>
                  i.id === issueId ? { ...i, step, position } : i,
                ),
              }
            : s,
        ),
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["situations"], ctx.previous);
      toast.error("Masalani ko'chirib bo'lmadi");
    },

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["situations"] });
      qc.invalidateQueries({ queryKey: ["situation", vars.situationId] });
    },
  });
}
