"use client";

import { CATEGORIES } from "@areeza/core/legal";
import type { CategoryCode, Classification } from "@areeza/core/types";
import { StatusPill } from "@areeza/ui/components/status-pill";
import { Button } from "@areeza/ui/components/button";
import { cn } from "@areeza/ui/lib/utils";
import { interactiveWeight } from "@areeza/ui/lib/font-weight";
import { Icon } from "@areeza/ui/icons";
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
  const pill = confidencePill(classification.confidenceLevel, locale);
  const showPicker =
    awaitingPick ||
    classification.needsCategoryPick ||
    classification.confidenceLevel === "low";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
        <span className="text-sm font-medium text-foreground">{classification.label}</span>
      </div>

      {classification.clarifyingQuestion ? (
        <p className="text-sm text-muted-foreground">{classification.clarifyingQuestion}</p>
      ) : null}

      {showPicker ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {locale === "ru"
              ? "Выберите тип дела:"
              : "Qaysi turdagi ish bo'yicha murojaat qilmoqchisiz?"}
          </p>
          <div className="flex flex-col gap-1.5">
            {CATEGORIES.filter((c) => c.code !== "other").map((cat) => (
              <button
                key={cat.code}
                type="button"
                onClick={() => onCategoryPick(cat.code)}
                className={cn(
                  "flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left text-sm",
                  interactiveWeight,
                  "text-foreground transition-colors hover:border-primary/30 hover:bg-muted/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  classification.categoryCode === cat.code &&
                    "border-primary bg-primary/10 font-medium",
                )}
              >
                <span>{locale === "ru" ? cat.labelRu : cat.labelUz}</span>
                <Icon name="arrowRight" size="sm" className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {onContinue && !showPicker && classification.categoryCode !== "other" ? (
        <Button type="button" size="sm" onClick={onContinue}>
          {locale === "ru" ? "Подтвердить и продолжить" : "Tasdiqlash va davom etish"}
        </Button>
      ) : null}
    </div>
  );
}
