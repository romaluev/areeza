import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const skeletonVariants = cva("rounded-lg bg-surface-4", {
  variants: {
    variant: {
      pulse: "animate-pulse motion-reduce:animate-none",
      shimmer:
        "relative overflow-hidden motion-reduce:animate-none after:absolute after:inset-0 after:translate-x-[-100%] after:animate-[shimmer_1.5s_ease-in-out_infinite] after:bg-gradient-to-r after:from-transparent after:via-foreground/8 after:to-transparent",
    },
  },
  defaultVariants: { variant: "shimmer" },
});

export function Skeleton({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

export { skeletonVariants };
