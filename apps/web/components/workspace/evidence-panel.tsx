"use client";

import { Badge } from "@areeza/ui/components/badge";
import { EmptyState } from "@areeza/ui/components/empty-state";
import type { EvidenceItem } from "@areeza/core/types";

export function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  if (evidence.length === 0) {
    return (
      <EmptyState
        variant="list"
        icon="file"
        title="Dalillar yo'q"
        description="Shartnoma, yozishmalar va boshqa dalillar shu ro'yxatda bo'ladi."
      />
    );
  }
  return (
    <ul className="space-y-2 p-4">
      {evidence.map((e) => (
        <li key={e.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-foreground">{e.title}</p>
            <Badge variant="secondary">{e.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{e.kind}</p>
          {e.fileUrl ? (
            <a href={e.fileUrl} className="mt-2 inline-block text-xs text-primary underline">
              Faylni ko&apos;rish
            </a>
          ) : null}
          {e.notes ? <p className="mt-1 text-xs text-muted-foreground">{e.notes}</p> : null}
        </li>
      ))}
    </ul>
  );
}
