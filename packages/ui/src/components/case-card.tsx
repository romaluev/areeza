"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { StatusPill } from "./status-pill";
import type { CaseStatus } from "@areeza/core/types";

export interface CaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  status: CaseStatus;
  statusLabel: string;
  categoryLabel?: string;
  meta?: React.ReactNode;
  footer?: React.ReactNode;
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

export function CaseCard({
  title,
  status,
  statusLabel,
  categoryLabel,
  meta,
  footer,
  className,
  ...props
}: CaseCardProps) {
  return (
    <Card
      className={cn(
        "transition-[box-shadow,transform] duration-[var(--dur-normal)] hover:shadow-surface-4",
        className,
      )}
      {...props}
    >
      <CardHeader className="gap-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{title}</CardTitle>
          <StatusPill tone={statusTone[status]}>{statusLabel}</StatusPill>
        </div>
        {categoryLabel ? (
          <Badge variant="outline" className="w-fit">
            {categoryLabel}
          </Badge>
        ) : null}
      </CardHeader>
      {(meta || footer) && (
        <CardContent className="flex flex-col gap-2 pt-0 text-sm text-[var(--muted-foreground)]">
          {meta}
          {footer}
        </CardContent>
      )}
    </Card>
  );
}
