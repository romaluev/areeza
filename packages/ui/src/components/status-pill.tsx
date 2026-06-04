import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium tabular-nums",
  {
    variants: {
      tone: {
        default: "border-foreground/20 bg-foreground/8 text-foreground",
        primary: "border-primary/20 bg-primary/10 text-primary",
        success: "border-success/20 bg-success/10 text-success",
        warn: "border-warn/20 bg-warn/10 text-warn",
        danger: "border-danger/20 bg-danger/10 text-danger",
        muted: "border-muted-foreground/20 bg-muted-foreground/10 text-muted-foreground",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> {
  dot?: boolean;
}

export function StatusPill({
  className,
  tone,
  dot = true,
  children,
  ...props
}: StatusPillProps) {
  return (
    <span className={cn(statusPillVariants({ tone }), className)} {...props}>
      {dot ? (
        <span
          className="size-1.5 shrink-0 rounded-full bg-current opacity-80"
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}

export { statusPillVariants };
