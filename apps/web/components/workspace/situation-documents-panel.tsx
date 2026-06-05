"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@areeza/ui/components/empty-state";
import { ListRow, ListRowGroup } from "@areeza/ui/components/list-row";
import { StatusPill } from "@areeza/ui/components/status-pill";
import { cn } from "@areeza/ui/lib/utils";
import type { Situation, SituationDocument } from "@areeza/core/types";
import { DocumentPanel } from "@/components/document/document-panel";

const FORUM_LABELS: Record<string, string> = {
  civil_court: "Sud",
  prosecutor: "Prokuratura",
  anticorruption_agency: "Agentlik",
  labor_inspectorate: "Inspeksiya",
  admin_authority: "Ma'muriy",
  family_court: "Oila",
};

export function SituationDocumentsPanel({
  situationId,
  situation,
}: {
  situationId: string;
  situation: Situation;
}) {
  const queryClient = useQueryClient();
  const [docId, setDocId] = useState(situation.documents[0]?.id ?? "");
  const active = situation.documents.find((d) => d.id === docId) ?? situation.documents[0];

  if (situation.documents.length === 0) {
    return (
      <EmptyState
        variant="list"
        icon="file"
        title="Hujjatlar tayyorlanmagan"
        description="Suhbat va marshrutdan keyin hujjatlar shu yerda paydo bo'ladi."
        className="h-full"
      />
    );
  }

  if (!active) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <nav
        className={cn(
          "shrink-0 border-border md:w-56 md:border-r",
          "border-b md:border-b-0",
          "overflow-x-auto md:overflow-y-auto",
        )}
        aria-label="Hujjatlar ro'yxati"
      >
        <ListRowGroup className="flex flex-row gap-0.5 p-2 md:flex-col md:gap-0">
          {situation.documents.map((d) => (
            <DocNavRow
              key={d.id}
              doc={d}
              selected={d.id === active.id}
              onSelect={() => setDocId(d.id)}
            />
          ))}
        </ListRowGroup>
      </nav>
      <div className="min-h-0 min-w-0 flex-1">
        <DocumentPanel
          caseId={situationId}
          documents={situation.documents}
          activeId={active.id}
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

function DocNavRow({
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
    <ListRow
      className={cn(
        "min-w-[10rem] shrink-0 md:min-w-0",
        selected && "border-primary/40",
      )}
      title={doc.title}
      subtitle={FORUM_LABELS[doc.destination] ?? doc.destination}
      selected={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      trailing={
        canFile !== undefined ? (
          <StatusPill tone={canFile ? "success" : "warn"}>
            {canFile ? "Tayyor" : "Tekshirish"}
          </StatusPill>
        ) : undefined
      }
    />
  );
}
