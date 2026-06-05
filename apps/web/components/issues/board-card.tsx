"use client";

import { memo } from "react";
import Link from "next/link";
import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import type { AnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BoardIssue } from "@areeza/core/types";
import { getCategoryLabel } from "@areeza/core/legal";
import { cn } from "@areeza/ui/lib/utils";
import type { AppLocale } from "@/lib/copy";
import { SeverityBars } from "./severity-bars";
import { severityLabel } from "./stage-config";

/** Pure presentational card — also used inside the drag overlay. */
export const BoardCardContent = memo(function BoardCardContent({
  issue,
  locale,
}: {
  issue: BoardIssue;
  locale: AppLocale;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 shadow-xs transition-shadow group-hover:shadow-sm">
      <p className="truncate text-2xs font-medium text-muted-foreground">
        {issue.situationTitle}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{issue.title}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1" title={severityLabel(issue.severity, locale)}>
          <SeverityBars severity={issue.severity} />
        </span>
        <span className="min-w-0 flex-1 truncate text-2xs text-muted-foreground">
          {getCategoryLabel(issue.categoryCode, locale)}
        </span>
      </div>
    </div>
  );
});

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) return false;
  return defaultAnimateLayoutChanges(args);
};

/** Draggable + clickable card. Click opens the parent situation's workspace. */
export const DraggableBoardCard = memo(function DraggableBoardCard({
  issue,
  locale,
}: {
  issue: BoardIssue;
  locale: AppLocale;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
    data: { step: issue.step },
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("touch-none", isDragging && "opacity-30")}
    >
      <Link
        href={`/situations/${issue.situationId}`}
        className={cn("group block transition-colors", isDragging && "pointer-events-none")}
      >
        <BoardCardContent issue={issue} locale={locale} />
      </Link>
    </div>
  );
});
