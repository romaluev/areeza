import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 border px-2.5 py-0.5 text-xs font-medium transition-[color,background-color,border-color] duration-[var(--dur-fast)]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-foreground/20 bg-secondary/90 text-foreground",
        outline: "border-foreground/20 bg-transparent text-foreground",
        success: "border-success/20 bg-success/10 text-success",
        warn: "border-warn/20 bg-warn/10 text-warn",
        danger: "border-danger/20 bg-danger/10 text-danger",
        muted: "border-muted-foreground/20 bg-muted-foreground/10 text-muted-foreground",
      },
      shape: {
        pill: "rounded-pill",
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
