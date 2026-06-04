"use client";

import { TimelineItem } from "@areeza/ui/components/timeline-item";
import type { TimelineEvent } from "@areeza/core/types";

export function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="p-4 text-sm text-muted">Vaqt chizig&apos;i bo&apos;sh.</p>;
  }
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="space-y-0 p-4">
      {sorted.map((e, i) => (
        <TimelineItem
          key={e.id}
          label={e.label}
          at={e.date}
          note={e.kind === "deadline" ? "Muddat" : undefined}
          active={e.kind === "deadline"}
          isLast={i === sorted.length - 1}
        />
      ))}
    </div>
  );
}
