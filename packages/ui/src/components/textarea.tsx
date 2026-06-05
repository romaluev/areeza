import * as React from "react";
import { cn } from "../lib/utils";

const formControlClass =
  "flex field-sizing-content w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-[color,box-shadow,border-color] duration-[var(--dur-fast)] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn("min-h-16", formControlClass, className)}
      {...props}
    />
  );
}
