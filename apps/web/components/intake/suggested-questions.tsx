"use client";

import { useCallback, useRef } from "react";
import { cn } from "@areeza/ui/lib/utils";
import {
  AskUserQuestions,
  type AskUserAnswer,
} from "@areeza/ui/components/fluid/ask-user-questions";

type Prompt = { id: string; text: string };

type Props = {
  prompts: Prompt[];
  onPick: (text: string) => void;
  disabled?: boolean;
  className?: string;
  layout?: "grid" | "stack";
  /** Question title shown above the options. */
  title?: string;
  locale?: "uz" | "ru";
};

const QUESTION_ID = "suggested";

export function SuggestedQuestions({
  prompts,
  onPick,
  disabled,
  className,
  layout = "grid",
  title,
  locale = "uz",
}: Props) {
  const pickedRef = useRef(false);

  const resolvedTitle =
    title ?? (locale === "ru" ? "Выберите вариант" : "Variantni tanlang");

  const handleAnswers = useCallback(
    (answers: Record<string, AskUserAnswer>) => {
      if (pickedRef.current) return;
      const answer = answers[QUESTION_ID];
      const selectedId = answer?.selectedIds?.[0];
      const other = answer?.otherText?.trim();
      if (selectedId) {
        const prompt = prompts.find((p) => p.id === selectedId);
        if (prompt) {
          pickedRef.current = true;
          onPick(prompt.text);
        }
      } else if (other) {
        pickedRef.current = true;
        onPick(other);
      }
    },
    [onPick, prompts],
  );

  return (
    <div className={cn(disabled && "pointer-events-none opacity-60", className)}>
      <AskUserQuestions
        className="max-w-full"
        showHeader={false}
        questions={[
          {
            id: QUESTION_ID,
            title: resolvedTitle,
            skippable: false,
            layout: layout === "stack" ? "stacked" : "inline",
            options: prompts.map((p) => ({ id: p.id, title: p.text })),
          },
        ]}
        onAnswersChange={handleAnswers}
      />
    </div>
  );
}
