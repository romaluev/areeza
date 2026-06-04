"use client";

import { cn } from "@areeza/ui/lib/utils";
import { PIPELINE_STEPS } from "@/lib/copy";
import type { PipelineStep } from "@areeza/core/types";

export function StepProgress({ current }: { current: PipelineStep }) {
  const idx = PIPELINE_STEPS.findIndex((s) => s.id === current);

  return (
    <ol
      className="flex flex-wrap items-center gap-1 rounded-lg bg-[var(--surface-3)] p-1 text-xs"
      aria-label="Ish jarayoni"
    >
      {PIPELINE_STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={step.id} className="flex items-center gap-1">
            <span
              className={cn(
                "rounded-[var(--radius-pill)] px-2 py-0.5 font-medium transition-colors duration-[var(--dur-fast)]",
                done && "bg-[var(--success-bg)] text-[var(--success)]",
                active &&
                  "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-2)]",
                !done && !active && "text-[var(--muted-foreground)]",
              )}
            >
              {step.label}
            </span>
            {i < PIPELINE_STEPS.length - 1 ? (
              <span className="text-[var(--muted-foreground)]" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
