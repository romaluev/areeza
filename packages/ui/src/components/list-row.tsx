"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { navRowTransition } from "../lib/nav-motion";
import { StatusPill } from "./status-pill";
import type { CaseStatus } from "@areeza/core/types";

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  status?: CaseStatus;
  statusLabel?: string;
  trailing?: React.ReactNode;
  /** @deprecated Ignored — kept for call-site compatibility */
  rowId?: string;
  interactive?: boolean;
  selected?: boolean;
}

const statusTone: Record<
  CaseStatus,
  "default" | "primary" | "success" | "warn" | "muted"
> = {
  draft: "muted",
  intake: "primary",
  classified: "primary",
  routed: "warn",
  drafted: "warn",
  validated: "success",
  ready: "success",
};

export function ListRowGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="list-row-group" className={cn("flex flex-col gap-0.5", className)} {...props}>
      {children}
    </div>
  );
}

export function ListRow({
  title,
  subtitle,
  status,
  statusLabel,
  trailing,
  interactive = true,
  selected = false,
  className,
  ...props
}: ListRowProps) {
  return (
    <div
      data-slot="list-row"
      role={interactive ? "option" : undefined}
      aria-selected={interactive ? selected : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-transparent",
        "h-[length:var(--density-row-h-default)] px-[length:var(--density-row-px)]",
        navRowTransition,
        interactive && "cursor-pointer hover:bg-accent/40",
        selected && "bg-accent",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {status && statusLabel ? (
        <StatusPill tone={statusTone[status]} className="shrink-0">
          {statusLabel}
        </StatusPill>
      ) : null}
      {trailing}
    </div>
  );
}
