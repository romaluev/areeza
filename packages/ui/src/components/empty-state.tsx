import * as React from "react";
import { cn } from "../lib/utils";
import { Icon, type IconName } from "../icons";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
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
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)]">
        <Icon name={icon} size="lg" />
      </div>
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
