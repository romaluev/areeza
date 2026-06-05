"use client";

import type { TopBarConfig } from "./top-bar-store";

/**
 * Shared top toolbar above the rounded main canvas (desktop). Matches
 * notiky's `paneHeader` treatment so it sits flush with the sidebar and
 * main panels. Title/icon on the left, page actions on the right.
 */
export function TopBar({ icon, title, description, pill, actions }: TopBarConfig) {
  if (!title && !description && !actions && !icon && !pill) return null;

  return (
    <header className="hidden min-h-[length:var(--density-pane-header-h)] shrink-0 select-none grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-border/40 bg-card px-3 py-1.5 shadow-sm md:grid">
      <div className="flex min-w-0 items-center gap-2">
        {icon ? (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            {title ? (
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                {title}
              </span>
            ) : null}
            {pill ? <span className="shrink-0">{pill}</span> : null}
          </div>
          {description ? (
            <p className="truncate text-xs text-muted-foreground" title={description}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1.5 self-center">{actions}</div>
      ) : null}
    </header>
  );
}
