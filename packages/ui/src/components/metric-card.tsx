import * as React from "react";
import { cn } from "../lib/utils";
import { Card, CardContent } from "./card";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  className,
  ...props
}: MetricCardProps) {
  return (
    <Card elevated className={cn("overflow-hidden", className)} {...props}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
