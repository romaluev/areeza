import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 border px-2.5 py-0.5 text-xs font-medium transition-[color,background-color,border-color] duration-[var(--dur-fast)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
        secondary:
          "border-[color-mix(in_oklab,var(--foreground)_20%,transparent)] bg-[color-mix(in_oklab,var(--secondary)_90%,transparent)] text-[var(--foreground)]",
        outline:
          "border-[color-mix(in_oklab,var(--foreground)_20%,transparent)] bg-transparent text-[var(--foreground)]",
        success:
          "border-[color-mix(in_oklab,var(--success)_20%,transparent)] bg-[color-mix(in_oklab,var(--success)_10%,transparent)] text-[var(--success)]",
        warn:
          "border-[color-mix(in_oklab,var(--warn)_20%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] text-[var(--warn)]",
        danger:
          "border-[color-mix(in_oklab,var(--danger)_20%,transparent)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] text-[var(--danger)]",
        muted:
          "border-[color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] bg-[color-mix(in_oklab,var(--muted-foreground)_10%,transparent)] text-[var(--muted-foreground)]",
      },
      shape: {
        pill: "rounded-[var(--radius-pill)]",
        rounded: "rounded-md",
      },
    },
    defaultVariants: { variant: "default", shape: "pill" },
  },
);

export function Badge({
  className,
  variant,
  shape,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant, shape }), className)} {...props} />;
}

export { badgeVariants };
