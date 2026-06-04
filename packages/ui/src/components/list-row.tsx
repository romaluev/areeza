"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useProximityHover } from "../hooks/use-proximity-hover";
import { StatusPill } from "./status-pill";
import type { CaseStatus } from "@areeza/core/types";

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  status?: CaseStatus;
  statusLabel?: string;
  trailing?: React.ReactNode;
  rowId?: string;
  interactive?: boolean;
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
  const ref = React.useRef<HTMLDivElement>(null);
  useProximityHover(ref, { axis: "y" });

  return (
    <div ref={ref} data-slot="list-row-group" className={cn("flex flex-col", className)} {...props}>
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
  rowId,
  interactive = true,
  className,
  ...props
}: ListRowProps) {
  const id = rowId ?? React.useId();

  return (
    <div
      data-proximity-id={id}
      data-slot="list-row"
      className={cn(
        "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5",
        "transition-[background-color,border-color] duration-[var(--dur-fast)]",
        interactive &&
          "cursor-pointer hover:border-[var(--border)] hover:bg-[var(--surface-3)] data-[proximity]:border-[var(--border)] data-[proximity]:bg-[var(--surface-3)]",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-[var(--muted-foreground)]">{subtitle}</p>
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
