import type { IssueSeverity } from "@areeza/core/types";
import { cn } from "@areeza/ui/lib/utils";
import { SEVERITY_CONFIG } from "./stage-config";

/** Four stacked bars filled to the issue's severity — a compact priority indicator. */
export function SeverityBars({
  severity,
  className,
}: {
  severity: IssueSeverity;
  className?: string;
}) {
  const filled = SEVERITY_CONFIG[severity].bars;
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-3.5", SEVERITY_CONFIG[severity].tone, className)}
      aria-hidden
    >
      {[0, 1, 2, 3].map((i) => {
        const height = 4 + i * 3;
        const on = i < filled;
        return (
          <rect
            key={i}
            x={1 + i * 4}
            y={14 - height}
            width={2.5}
            height={height}
            rx={0.75}
            fill="currentColor"
            opacity={on ? 1 : 0.28}
          />
        );
      })}
    </svg>
  );
}
