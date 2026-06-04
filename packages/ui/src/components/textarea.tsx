import * as React from "react";
import { cn } from "../lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full min-w-0 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm shadow-xs",
        "transition-[color,box-shadow,border-color] duration-[var(--dur-fast)]",
        "placeholder:text-[var(--muted-foreground)]",
        "focus-visible:border-[var(--ring)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-[var(--destructive)] aria-invalid:ring-[var(--destructive)]/20",
        className,
      )}
      {...props}
    />
  );
}
