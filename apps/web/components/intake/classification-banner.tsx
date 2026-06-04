"use client";

import { CATEGORIES } from "@areeza/core/legal";
import type { CategoryCode, Classification } from "@areeza/core/types";
import { StatusPill } from "@areeza/ui/components/status-pill";
import { Button } from "@areeza/ui/components/button";
import { cn } from "@areeza/ui/lib/utils";
import { interactiveWeight } from "@areeza/ui/lib/font-weight";
import { Icon } from "@areeza/ui/icons";
import { useRef } from "react";
import { useProximityHover } from "@areeza/ui/hooks/use-proximity-hover";
import { confidencePill } from "@/lib/intake-copy";

type Props = {
  classification: Classification;
  locale: "uz" | "ru";
  awaitingPick: boolean;
  onCategoryPick: (code: CategoryCode) => void;
  onContinue?: () => void;
};

export function ClassificationBanner({
  classification,
  locale,
  awaitingPick,
  onCategoryPick,
  onContinue,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  useProximityHover(listRef, { axis: "y" });
  const pill = confidencePill(classification.confidenceLevel, locale);
  const showPicker =
    awaitingPick ||
    classification.needsCategoryPick ||
    classification.confidenceLevel === "low";

  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
        <span className="text-sm font-medium text-[var(--foreground)]">
          {classification.label}
        </span>
      </div>

      {classification.clarifyingQuestion ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          {classification.clarifyingQuestion}
        </p>
      ) : null}

      {showPicker ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            {locale === "ru"
              ? "Выберите тип дела:"
              : "Qaysi turdagi ish bo'yicha murojaat qilmoqchisiz?"}
          </p>
          <div ref={listRef} className="flex flex-col gap-1.5">
            {CATEGORIES.filter((c) => c.code !== "other").map((cat) => (
              <button
                key={cat.code}
                type="button"
                data-proximity-id={cat.code}
                onClick={() => onCategoryPick(cat.code)}
                className={cn(
                  "flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left text-sm",
                  interactiveWeight,
                  "text-[var(--foreground)] hover:bg-[var(--card)]",
                  "data-[proximity]:bg-[var(--card)] data-[proximity]:font-medium",
                  classification.categoryCode === cat.code &&
                    "border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] font-medium",
                )}
              >
                <span>{locale === "ru" ? cat.labelRu : cat.labelUz}</span>
                <Icon name="arrowRight" size="sm" className="text-[var(--muted-foreground)]" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {classification.confidenceLevel === "medium" && !showPicker && onContinue ? (
        <Button type="button" size="sm" variant="secondary" onClick={onContinue}>
          {locale === "ru" ? "Подтвердить и продолжить" : "Tasdiqlash va davom etish"}
        </Button>
      ) : null}

      {awaitingPick && classification.categoryCode !== "other" ? (
        <Button type="button" size="sm" onClick={onContinue}>
          {locale === "ru" ? "Продолжить" : "Davom etish"}
        </Button>
      ) : null}
    </div>
  );
}
