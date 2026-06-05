"use client";

import { useCallback, useRef } from "react";
import { cn } from "@areeza/ui/lib/utils";
import {
  AskUserQuestions,
  type AskUserAnswer,
} from "@areeza/ui/components/fluid/ask-user-questions";

const QUESTION_ID = "intake-question";

/**
 * Single-question wizard shown above the composer when an intake `question`
 * event carries `options`. Lettered single-select option buttons (auto-advance)
 * plus a free-text "other". On answer the synthesized text is fed straight back
 * through the intake send path — same as typing the answer.
 */
export function QuestionBlock({
  question,
  options,
  onAnswer,
  disabled,
  locale = "uz",
  className,
}: {
  question: string;
  options: string[];
  onAnswer: (text: string) => void;
  disabled?: boolean;
  locale?: "uz" | "ru";
  className?: string;
}) {
  const answeredRef = useRef(false);

  const handleAnswers = useCallback(
    (answers: Record<string, AskUserAnswer>) => {
      if (answeredRef.current) return;
      const answer = answers[QUESTION_ID];
      const selectedId = answer?.selectedIds?.[0];
      const other = answer?.otherText?.trim();
      if (selectedId) {
        const index = Number(selectedId.replace("opt-", ""));
        const text = options[index];
        if (text) {
          answeredRef.current = true;
          onAnswer(text);
        }
      } else if (other) {
        answeredRef.current = true;
        onAnswer(other);
      }
    },
    [onAnswer, options],
  );

  return (
    <div className={cn(disabled && "pointer-events-none opacity-60", className)}>
      <AskUserQuestions
        className="max-w-full"
        showHeader={false}
        questions={[
          {
            id: QUESTION_ID,
            title: question,
            skippable: false,
            layout: "stacked",
            allowOther: true,
            otherPlaceholder:
              locale === "ru" ? "Свой вариант…" : "O'zingiz yozing…",
            options: options.map((text, i) => ({ id: `opt-${i}`, title: text })),
          },
        ]}
        onAnswersChange={handleAnswers}
      />
    </div>
  );
}
