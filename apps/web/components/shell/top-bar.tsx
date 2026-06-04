"use client";

import type { TopBarConfig } from "./top-bar-store";
import { cn } from "@areeza/ui/lib/utils";

/**
 * Lightweight toolbar above the rounded main canvas (desktop).
 */
export function TopBar({ title, description, actions }: TopBarConfig) {
  if (!title && !description && !actions) return null;

  return (
    <header
      className={cn(
        "hidden min-h-10 shrink-0 select-none items-center gap-3 rounded-2xl border border-border/40 bg-card px-3 py-2 shadow-sm md:flex",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title ? (
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            {title}
          </span>
        ) : null}
        {description ? (
          <p className="truncate text-xs text-muted-foreground" title={description}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1.5 self-center">{actions}</div>
      ) : null}
    </header>
  );
}
