"use client";

import type { EvidenceItem } from "@areeza/core/types";
import { Badge } from "@areeza/ui/components/badge";

export function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  if (evidence.length === 0) {
    return <p className="p-4 text-sm text-muted">Dalillar hali qo&apos;shilmagan.</p>;
  }
  return (
    <ul className="space-y-2 p-4">
      {evidence.map((e) => (
        <li key={e.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-ink">{e.title}</p>
            <Badge variant="secondary">{e.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">{e.kind}</p>
          {e.fileUrl ? (
            <a href={e.fileUrl} className="mt-2 inline-block text-xs text-primary underline">
              Faylni ko&apos;rish
            </a>
          ) : null}
          {e.notes ? <p className="mt-1 text-xs text-muted">{e.notes}</p> : null}
        </li>
      ))}
    </ul>
  );
}
