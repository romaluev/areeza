"use client";

import type { DocSection } from "@areeza/core/types";
import { cn } from "@areeza/ui/lib/utils";
import { formatSectionText, sectionPaperClass } from "./document-utils";

export function DocumentChromeSection({ section }: { section: DocSection }) {
  return (
    <div
      data-section-id={section.id}
      data-legal-chrome
      className={cn(
        "legal-chrome whitespace-pre-wrap select-none",
        sectionPaperClass(section.kind),
      )}
      aria-readonly="true"
    >
      {formatSectionText(section.content)}
    </div>
  );
}
