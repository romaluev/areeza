"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { BoardIssue, PipelineStep } from "@areeza/core/types";
import { cn } from "@areeza/ui/lib/utils";
import type { AppLocale } from "@/lib/copy";
import { DraggableBoardCard } from "./board-card";
import { STAGE_CONFIG, stageLabel } from "./stage-config";

export function BoardColumn({
  step,
  issueIds,
  issueMap,
  locale,
}: {
  step: PipelineStep;
  issueIds: string[];
  issueMap: Map<string, BoardIssue>;
  locale: AppLocale;
}) {
  const cfg = STAGE_CONFIG[step];
  const { setNodeRef, isOver } = useDroppable({ id: step });

  const resolved = useMemo(
    () => issueIds.flatMap((id) => (issueMap.get(id) ? [issueMap.get(id)!] : [])),
    [issueIds, issueMap],
  );

  return (
    <div className={cn("flex w-[272px] shrink-0 flex-col rounded-xl p-2", cfg.columnBg)}>
      <div className="mb-2 flex items-center gap-2 px-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold",
            cfg.badge,
          )}
        >
          <span className={cn("size-1.5 rounded-full", cfg.dot)} />
          {stageLabel(step, locale)}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">{issueIds.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[180px] flex-1 space-y-2 rounded-lg p-1 transition-colors",
          isOver && "bg-accent/60",
        )}
      >
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {resolved.map((issue) => (
            <DraggableBoardCard key={issue.id} issue={issue} locale={locale} />
          ))}
        </SortableContext>
        {issueIds.length === 0 && (
          <p className="py-8 text-center text-2xs text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}
