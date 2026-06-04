"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../lib/utils";

export function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const pct = value ?? 0;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-pill bg-surface-4",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 rounded-pill bg-primary transition-[transform] duration-[var(--dur-normal)] ease-[var(--ease-std)] motion-reduce:transition-none"
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
