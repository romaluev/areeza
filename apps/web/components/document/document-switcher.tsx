"use client";

import { Segmented } from "@areeza/ui/components/segmented";
import type { GeneratedDocument } from "@areeza/core/types";
import { documentKindLabel } from "./document-utils";

export function DocumentSwitcher({
  documents,
  activeId,
  onSelect,
  disabled,
}: {
  documents: GeneratedDocument[];
  activeId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  if (documents.length <= 1) return null;

  return (
    <Segmented
      layoutId="document-switcher"
      aria-label="Hujjatlar"
      value={activeId}
      onValueChange={onSelect}
      options={documents.map((doc) => ({
        value: doc.id,
        label: (
          <span className="flex items-center gap-1.5">
            <span className="truncate max-w-[9rem]">{doc.title}</span>
            {doc.status === "generating" ? (
              <span className="text-[10px] text-muted-foreground">…</span>
            ) : null}
          </span>
        ),
        disabled: disabled && doc.id !== activeId,
      }))}
      className="w-full max-w-full overflow-x-auto"
    />
  );
}

export function DocumentSwitcherHint({ doc }: { doc: GeneratedDocument }) {
  return (
    <p className="text-[11px] text-muted-foreground">
      {documentKindLabel(doc.kind)}
      {doc.claimAmount ? ` · ${doc.claimAmount}` : ""}
    </p>
  );
}
