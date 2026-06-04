import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-medium tabular-nums",
  {
    variants: {
      tone: {
        default:
          "border-[color-mix(in_oklab,var(--foreground)_20%,transparent)] bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] text-[var(--foreground)]",
        primary:
          "border-[color-mix(in_oklab,var(--primary)_20%,transparent)] bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)]",
        success:
          "border-[color-mix(in_oklab,var(--success)_20%,transparent)] bg-[color-mix(in_oklab,var(--success)_10%,transparent)] text-[var(--success)]",
        warn:
          "border-[color-mix(in_oklab,var(--warn)_20%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] text-[var(--warn)]",
        danger:
          "border-[color-mix(in_oklab,var(--danger)_20%,transparent)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] text-[var(--danger)]",
        muted:
          "border-[color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] bg-[color-mix(in_oklab,var(--muted-foreground)_10%,transparent)] text-[var(--muted-foreground)]",
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
