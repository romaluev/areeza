"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { surfaceClasses } from "../lib/surface-classes";
import { useSurfaceLevel } from "../lib/surface-context";

export interface CardProps extends React.ComponentProps<"div"> {
  density?: "comfortable" | "compact";
  /** @deprecated Use `density="compact"` instead. */
  size?: "default" | "sm";
  elevated?: boolean;
  surfaceOffset?: number;
}

export function Card({
  className,
  density = "comfortable",
  size,
  elevated = false,
  surfaceOffset = 0,
  style,
  ...props
}: CardProps) {
  const parentLevel = useSurfaceLevel();
  const resolvedDensity = size === "sm" ? "compact" : density;
  const level = Math.min(8, Math.max(1, parentLevel + (elevated ? 2 : 0) + surfaceOffset));

  return (
    <div
      data-slot="card"
      data-density={resolvedDensity}
      data-surface={elevated ? level : undefined}
      style={style}
      className={cn(
        "group/card flex flex-col overflow-hidden rounded-xl text-sm text-card-foreground shadow-sm has-data-[slot=card-footer]:pb-0",
        elevated
          ? surfaceClasses(level, 3)
          : "bg-card ring-1 ring-foreground/10",
        resolvedDensity === "comfortable" && "gap-6 py-6",
        resolvedDensity === "compact" && "gap-3 py-3",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 rounded-t-xl px-6 group-data-[density=compact]/card:px-3",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base font-medium leading-snug group-data-[density=compact]/card:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 group-data-[density=compact]/card:px-3", className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-6 group-data-[density=compact]/card:p-3",
        className,
      )}
      {...props}
    />
  );
}
