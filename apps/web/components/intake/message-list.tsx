"use client";

import type { CaseMessage } from "@areeza/core/types";
import { cn } from "@areeza/ui/lib/utils";
import { MessageBubble } from "./message-bubble";
import { ThinkingIndicator } from "./thinking-indicator";
import { IntakeHero } from "./intake-hero";
import { useStickToBottom } from "./use-stick-to-bottom";

export function MessageList({
  messages,
  streaming,
  assistantBuffer,
  locale,
  onSuggestedPick,
  streamDisabled,
}: {
  messages: CaseMessage[];
  streaming?: boolean;
  assistantBuffer?: string;
  locale?: "uz" | "ru";
  onSuggestedPick?: (text: string) => void;
  streamDisabled?: boolean;
}) {
  const lang = locale ?? "uz";
  const { viewportRef } = useStickToBottom(
    [messages, streaming, assistantBuffer],
    !!streaming,
  );

  const isEmpty = messages.length === 0 && !assistantBuffer;

  return (
    <div
      ref={viewportRef}
      className={cn(
        "h-full min-h-[200px] flex-1 overflow-y-auto overscroll-contain pr-2",
        "scroll-smooth motion-reduce:scroll-auto",
      )}
    >
      <div className="flex flex-col gap-4 pb-20">
        {isEmpty && onSuggestedPick ? (
          <IntakeHero
            locale={lang}
            onPick={onSuggestedPick}
            disabled={streamDisabled}
          />
        ) : null}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {assistantBuffer ? (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: assistantBuffer,
              createdAt: new Date().toISOString(),
            }}
          />
        ) : null}
        {streaming && !assistantBuffer ? (
          <ThinkingIndicator locale={lang} />
        ) : null}
      </div>
    </div>
  );
}
