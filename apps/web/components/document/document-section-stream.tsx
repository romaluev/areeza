"use client";

import { useEffect, useRef } from "react";
import { useTypewriter } from "@areeza/ui/hooks/use-typewriter";
import { cn } from "@areeza/ui/lib/utils";
import type { DocSectionKind } from "@areeza/core/types";
import { formatSectionText, sectionPaperClass } from "./document-utils";

export function DocumentSectionStream({
  sectionId,
  kind,
  content,
  isActive,
  done,
  showCaret,
  onVisible,
}: {
  sectionId: string;
  kind: DocSectionKind;
  content: string;
  isActive: boolean;
  done: boolean;
  showCaret: boolean;
  onVisible?: (id: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const streaming = isActive && !done;

  const { displayed, isComplete } = useTypewriter(content, {
    resetOnChange: false,
    instant: streaming || !isActive,
  });

  useEffect(() => {
    if (isActive && ref.current) {
      onVisible?.(sectionId);
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive, sectionId, onVisible, displayed.length]);

  const text = streaming ? content : isActive ? displayed : content;
  const pending = isActive && (streaming || !isComplete);

  return (
    <section
      ref={ref}
      data-section-id={sectionId}
      className={cn(
        "whitespace-pre-wrap transition-opacity duration-200",
        sectionPaperClass(kind),
        pending && "opacity-95",
        !pending && isActive && done && "areeza-rise",
      )}
      aria-busy={pending}
    >
      {formatSectionText(text)}
      {showCaret && pending ? (
        <span className="ml-0.5 inline-block w-[2px] translate-y-px bg-primary animate-caret-blink">
          &nbsp;
        </span>
      ) : null}
      {pending ? (
        <span className="mt-1 block text-[11px] shimmer-text">Yozilmoqda…</span>
      ) : null}
    </section>
  );
}
