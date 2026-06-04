"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@areeza/ui/lib/utils";
import { StatusPill } from "@areeza/ui/components/status-pill";
import type { Situation, SituationDocument } from "@areeza/core/types";
import { DocumentPanel } from "@/components/document/document-panel";

const forumLabel: Record<string, string> = {
  civil_court: "Sud",
  prosecutor: "Prokuratura",
  anticorruption_agency: "Agentlik",
  labor_inspectorate: "Inspeksiya",
  admin_authority: "Ma'muriy",
  family_court: "Oila",
};

export function SituationDocumentsPanel({ situationId, situation }: {
  situationId: string;
  situation: Situation;
}) {
  const queryClient = useQueryClient();
  const [docId, setDocId] = useState(situation.documents[0]?.id ?? "");
  const active = situation.documents.find((d) => d.id === docId) ?? situation.documents[0];

  if (!active) {
    return <p className="p-4 text-sm text-muted">Hujjatlar hali tayyorlanmagan.</p>;
  }

  return (
    <div className="flex min-h-0 flex-1">
      <nav className="w-52 shrink-0 overflow-y-auto border-r border-border p-2">
        {situation.documents.map((d) => (
          <DocSwitcherItem
            key={d.id}
            doc={d}
            selected={d.id === active.id}
            onSelect={() => setDocId(d.id)}
          />
        ))}
      </nav>
      <div className="min-h-0 min-w-0 flex-1">
        <DocumentPanel
          caseId={situationId}
          documents={situation.documents}
          legacyDocument={active}
          hasRoute={situation.issues.some((i) => i.route)}
          onUpdated={() => {
            void queryClient.invalidateQueries({ queryKey: ["situation", situationId] });
          }}
        />
      </div>
    </div>
  );
}

function DocSwitcherItem({
  doc,
  selected,
  onSelect,
}: {
  doc: SituationDocument;
  selected: boolean;
  onSelect: () => void;
}) {
  const canFile = doc.validation?.canFile;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "mb-1 w-full rounded-lg border px-2 py-2 text-left text-xs transition-colors",
        selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-surface-2",
      )}
    >
      <p className="font-medium text-ink line-clamp-2">{doc.title}</p>
      <p className="mt-1 text-muted">{forumLabel[doc.destination] ?? doc.destination}</p>
      {canFile !== undefined ? (
        <StatusPill tone={canFile ? "success" : "warn"} className="mt-1">
          {canFile ? "Tayyor" : "Tekshirish"}
        </StatusPill>
      ) : null}
    </button>
  );
}
