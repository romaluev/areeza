"use client";

import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
} from "@areeza/ui/components/fluid/thinking-steps";
import { StatusPill } from "@areeza/ui/components/status-pill";
import type { IntakeTrace } from "@/lib/intake-trace";

/**
 * Collapsible "thinking" panel rendered under the streaming assistant turn.
 * Surfaces the pipeline events derived in `traceRowFromEvent` as labeled rows.
 */
export function ThinkingTrace({
  traces,
  streaming,
  locale,
}: {
  traces: IntakeTrace[];
  streaming?: boolean;
  locale: "uz" | "ru";
}) {
  if (traces.length === 0) return null;

  const headerLabel = streaming
    ? locale === "ru"
      ? "Анализ"
      : "Tahlil qilinmoqda"
    : locale === "ru"
      ? "Готово"
      : "Tayyor";

  return (
    <ThinkingSteps
      defaultOpen={streaming}
      className="w-full max-w-3xl rounded-xl border border-border/50 bg-muted/20 px-2 py-1.5"
    >
      <ThinkingStepsHeader>
        <StatusPill tone={streaming ? "primary" : "muted"} dot>
          {headerLabel}
        </StatusPill>
      </ThinkingStepsHeader>
      <ThinkingStepsContent>
        {traces.map((t, i) => (
          <ThinkingStep
            key={t.id}
            index={i}
            label={t.label}
            icon={t.icon}
            status="complete"
            isLast={i === traces.length - 1}
          />
        ))}
      </ThinkingStepsContent>
    </ThinkingSteps>
  );
}
