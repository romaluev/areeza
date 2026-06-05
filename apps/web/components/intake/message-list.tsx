"use client";

import type { CaseMessage } from "@areeza/core/types";
import { ChatScrollArea } from "@areeza/ui/layout/page-layout-primitives";
import { ThinkingIndicator } from "@areeza/ui/components/fluid/thinking-indicator";
import { cn } from "@areeza/ui/lib/utils";
import { MessageBubble } from "./message-bubble";
import { IntakeHero } from "./intake-hero";
import { ThinkingTrace } from "./thinking-trace";
import type { IntakeTrace } from "@/lib/intake-trace";

const THINKING_WORDS_UZ = ["Tahlil qilinmoqda", "Faktlar ajratilmoqda", "Yo'nalish aniqlanmoqda"];
const THINKING_WORDS_RU = ["Анализ", "Извлечение фактов", "Определение маршрута"];

export function MessageList({
  messages,
  streaming,
  assistantBuffer,
  traces,
  locale,
  onSuggestedPick,
  streamDisabled,
  heroVariant = "full",
  className,
}: {
  messages: CaseMessage[];
  streaming?: boolean;
  assistantBuffer?: string;
  traces?: IntakeTrace[];
  locale?: "uz" | "ru";
  onSuggestedPick?: (text: string) => void;
  streamDisabled?: boolean;
  /** `chips-only` hides hero title copy when the page already has a heading. */
  heroVariant?: "full" | "chips-only";
  className?: string;
}) {
  const lang = locale ?? "uz";
  const isEmpty = messages.length === 0 && !assistantBuffer;

  return (
    <ChatScrollArea
      className={cn("h-full min-h-[200px] flex-1 pr-2", className)}
      innerClassName="gap-3 pb-20"
      stickToBottom={{ deps: [messages, streaming, assistantBuffer, traces] }}
    >
      {isEmpty && onSuggestedPick ? (
        <IntakeHero
          locale={lang}
          onPick={onSuggestedPick}
          disabled={streamDisabled}
          variant={heroVariant}
        />
      ) : null}
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} locale={lang} />
      ))}
      {assistantBuffer ? (
        <MessageBubble
          streaming
          locale={lang}
          message={{
            id: "streaming",
            role: "assistant",
            content: assistantBuffer,
            createdAt: new Date().toISOString(),
          }}
        />
      ) : null}
      {streaming && !assistantBuffer ? (
        <ThinkingIndicator
          words={lang === "ru" ? THINKING_WORDS_RU : THINKING_WORDS_UZ}
        />
      ) : null}
      {traces && traces.length > 0 ? (
        <ThinkingTrace traces={traces} streaming={streaming} locale={lang} />
      ) : null}
    </ChatScrollArea>
  );
}
