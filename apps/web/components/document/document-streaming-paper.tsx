"use client";

import { useCallback, useRef } from "react";
import type { StreamingSectionState } from "./use-document-stream";

import { DocumentSectionStream } from "./document-section-stream";

export function DocumentStreamingPaper({
  sections,
  activeSectionId,
}: {
  sections: StreamingSectionState[];
  activeSectionId: string | null;
}) {
  const paperRef = useRef<HTMLDivElement>(null);

  const handleVisible = useCallback((id: string) => {
    const el = paperRef.current?.querySelector(`[data-section-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <div
      ref={paperRef}
      id="print-document"
      className="legal-paper relative max-h-[min(70vh,720px)] overflow-y-auto rounded-lg border border-[var(--border)] bg-[#fcfbf7] px-6 py-8 shadow-inner dark:bg-[#1a1814]"
      aria-live="polite"
      aria-busy={activeSectionId !== null}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[var(--primary)]/20 via-[var(--accent-gold)]/30 to-[var(--primary)]/20" />
      <div className="space-y-4">
        {sections.map((section) => (
          <DocumentSectionStream
            key={section.id}
            sectionId={section.id}
            kind={section.kind}
            content={section.content}
            isActive={section.id === activeSectionId}
            showCaret={section.id === activeSectionId && !section.done}
            onVisible={handleVisible}
          />
        ))}
      </div>
    </div>
  );
}
