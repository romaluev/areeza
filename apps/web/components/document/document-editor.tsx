"use client";

import type { GeneratedDocument } from "@areeza/core/types";
import { DocumentChromeSection } from "./document-chrome-section";
import { DocumentSectionEditor } from "./document-section-editor";
import { isLegalChromeSection } from "./document-utils";

export function DocumentEditor({
  document,
  editorKey,
  onSectionChange,
}: {
  document: GeneratedDocument;
  editorKey: string;
  onSectionChange: (sectionId: string, content: string) => void;
}) {
  return (
    <div
      id="print-document"
      className="legal-paper relative max-h-[min(70vh,720px)] overflow-y-auto rounded-lg border border-[var(--border)] bg-[#fcfbf7] px-6 py-8 shadow-inner dark:bg-[#1a1814]"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[var(--primary)]/20 via-[var(--accent-gold)]/30 to-[var(--primary)]/20" />
      <div className="space-y-4">
        {document.sections.map((section) =>
          isLegalChromeSection(section) ? (
            <DocumentChromeSection key={`${editorKey}-${section.id}`} section={section} />
          ) : (
            <DocumentSectionEditor
              key={`${editorKey}-${section.id}`}
              section={section}
              editorKey={`${editorKey}-${section.id}`}
              onContentChange={onSectionChange}
            />
          ),
        )}
      </div>
    </div>
  );
}
