import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const kbdVariants = cva(
  "inline-flex h-5 min-w-5 select-none items-center justify-center rounded border px-1 font-mono text-[10px] font-medium leading-none",
  {
    variants: {
      variant: {
        default: "border-border/70 bg-muted text-muted-foreground",
        hint: "border-transparent bg-transparent text-muted-foreground/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface KbdProps
  extends ComponentProps<"kbd">,
    VariantProps<typeof kbdVariants> {}

/** Small keyboard-hint chip. `hint` variant blends into a button row. */
export function Kbd({ className, variant, ...props }: KbdProps) {
  return <kbd className={cn(kbdVariants({ variant }), className)} {...props} />;
}

export { kbdVariants };
