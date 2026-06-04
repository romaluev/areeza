"use client";

import { motion } from "framer-motion";
import { Icon } from "@areeza/ui/icons";
import { useMotionTransition } from "@areeza/ui/hooks/use-reduced-motion";
import { cn } from "@areeza/ui/lib/utils";
import { GUIDED_PROMPTS } from "@/lib/intake-copy";
import { SuggestedQuestions } from "./suggested-questions";

type Props = {
  locale: "uz" | "ru";
  onPick: (text: string) => void;
  disabled?: boolean;
};

export function IntakeHero({ locale, onPick, disabled }: Props) {
  const transition = useMotionTransition("gentle");
  const prompts = GUIDED_PROMPTS[locale];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="flex flex-col items-center justify-center gap-6 py-10 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)]">
        <Icon name="scale" size="lg" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
          {locale === "ru" ? "Что произошло?" : "Nima bo'ldi?"}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          {locale === "ru"
            ? "Опишите ситуацию простыми словами — Areeza задаст один уточняющий вопрос за раз."
            : "Muammoingizni oddiy tilda yozing — Areeza bir vaqtning o'zida bitta savol beradi."}
        </p>
      </div>
      <SuggestedQuestions
        prompts={prompts}
        onPick={onPick}
        disabled={disabled}
        className="w-full max-w-lg"
      />
    </motion.div>
  );
}
