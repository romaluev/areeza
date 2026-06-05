"use client";

import type { LegalArticle } from "@areeza/core/types";
import { cn } from "@areeza/ui/lib/utils";

/**
 * The RAG confirm step: shows the real lex.uz articles the pipeline retrieved as the
 * legal basis, and asks the citizen to confirm before any document is drafted
 * (human-in-the-loop). "Tasdiqlayman" feeds the confirm turn back through intake;
 * "Tahrirlash" returns focus to the composer so they can correct the facts.
 */
export function SourcesCard({
  articles,
  prompt,
  onConfirm,
  onEdit,
  disabled,
  locale = "uz",
  className,
}: {
  articles: LegalArticle[];
  prompt: string;
  onConfirm: () => void;
  onEdit: () => void;
  disabled?: boolean;
  locale?: "uz" | "ru";
  className?: string;
}) {
  const confirmLabel = locale === "ru" ? "Подтверждаю" : "Tasdiqlayman";
  const editLabel = locale === "ru" ? "Изменить" : "Tahrirlash";
  const basisLabel = locale === "ru" ? "Правовая основа (lex.uz)" : "Qonuniy asos (lex.uz)";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{prompt}</p>

      {articles.length > 0 ? (
        <>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {basisLabel}
          </p>
          <ul className="mt-2 space-y-2">
            {articles.map((a, i) => (
              <li
                key={`${a.code}-${a.article}-${i}`}
                className="rounded-lg border border-border/70 bg-background/60 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-snug text-foreground">
                    {a.title}
                  </span>
                  {a.source ? (
                    <span className="shrink-0 rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                      {a.source}
                      {a.article ? ` ${a.article}-modda` : ""}
                    </span>
                  ) : null}
                </div>
                {a.text ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {a.text}
                  </p>
                ) : null}
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[11px] text-accent underline-offset-2 hover:underline"
                  >
                    lex.uz →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-50"
        >
          {editLabel}
        </button>
      </div>
    </div>
  );
}
