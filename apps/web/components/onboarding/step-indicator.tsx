"use client";

import { cn } from "@areeza/ui/lib/utils";
import type { AppLocale } from "@/lib/copy";

interface StepIndicatorProps {
  /** 1-based index of the active step. */
  current: number;
  total: number;
  locale?: AppLocale;
  className?: string;
}

export function StepIndicator({
  current,
  total,
  locale = "uz",
  className,
}: StepIndicatorProps) {
  const index = Math.max(1, Math.min(total, current));
  const eyebrow =
    locale === "ru" ? `Шаг ${index} из ${total}` : `${index}-qadam, jami ${total}`;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="flex items-center justify-center gap-2" aria-hidden>
        {Array.from({ length: total }).map((_, i) => {
          const pos = i + 1;
          return (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color]",
                pos === index
                  ? "w-6 bg-primary"
                  : pos < index
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-border",
              )}
            />
          );
        })}
      </div>
      <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {eyebrow}
      </p>
    </div>
  );
}
