import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Icon, type IconName } from "../icons";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center select-none text-center",
  {
    variants: {
      variant: {
        page: "h-full px-6 py-12",
        list: "px-4 py-12",
        dashed:
          "h-full rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12",
      },
    },
    defaultVariants: { variant: "page" },
  },
);

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "folder",
  title,
  description,
  action,
  variant = "page",
  className,
  ...props
}: EmptyStateProps) {
  const iconSize = variant === "page" ? "lg" : "md";

  return (
    <div
      data-slot="empty-state"
      className={cn(emptyStateVariants({ variant }), className)}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-muted text-muted-foreground",
          variant === "page" ? "mb-4 size-12" : "mb-3 size-10",
        )}
      >
        <Icon
          name={icon}
          size={iconSize}
          className={cn(variant === "page" && "size-5")}
        />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export { emptyStateVariants };
