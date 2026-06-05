"use client";

import { Icon } from "@areeza/ui/icons";
import { cn } from "@areeza/ui/lib/utils";
import { GUIDED_PROMPTS } from "@/lib/intake-copy";
import { SuggestedQuestions } from "./suggested-questions";

type Props = {
  locale: "uz" | "ru";
  onPick: (text: string) => void;
  disabled?: boolean;
  variant?: "full" | "chips-only";
};

export function IntakeHero({ locale, onPick, disabled, variant = "full" }: Props) {
  const prompts = GUIDED_PROMPTS[locale];
  const chipsOnly = variant === "chips-only";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 py-10 text-center",
        chipsOnly && "gap-4 py-6",
      )}
    >
      {!chipsOnly ? (
        <>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/30 text-accent-foreground">
            <Icon name="scale" size="lg" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {locale === "ru" ? "Что произошло?" : "Nima bo'ldi?"}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {locale === "ru"
                ? "Опишите ситуацию простыми словами — Areeza задаст один уточняющий вопрос за раз."
                : "Muammoingizni oddiy tilda yozing — Areeza bir vaqtning o'zida bitta savol beradi."}
            </p>
          </div>
        </>
      ) : (
        <p className="max-w-md text-sm text-muted-foreground">
          {locale === "ru"
            ? "Выберите пример или опишите ситуацию ниже."
            : "Namunani tanlang yoki pastda vaziyatingizni yozing."}
        </p>
      )}
      <SuggestedQuestions
        prompts={prompts}
        onPick={onPick}
        disabled={disabled}
        title=""
        className="w-full max-w-lg"
      />
    </div>
  );
}
