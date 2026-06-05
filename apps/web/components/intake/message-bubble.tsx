"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Markdown } from "@areeza/ui/markdown";
import { StreamingMarkdown } from "@areeza/ui/markdown/StreamingMarkdown";
import { Icon } from "@areeza/ui/icons";
import { ChatMessage } from "@areeza/ui/components/fluid/chat-message";
import type { CaseMessage } from "@areeza/core/types";
import { ComposerIconButton } from "./composer-icon-button";

export function MessageBubble({
  message,
  streaming,
  locale = "uz",
}: {
  message: CaseMessage;
  streaming?: boolean;
  locale?: "uz" | "ru";
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.message(locale === "ru" ? "Скопировано" : "Nusxa olindi", {
        duration: 1500,
      });
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(locale === "ru" ? "Не удалось скопировать" : "Nusxa olinmadi");
    }
  }, [locale, message.content]);

  const showCopy = !isUser && !streaming && message.content.trim().length > 0;

  return (
    <ChatMessage
      from={isUser ? "user" : "assistant"}
      actions={
        showCopy ? (
          <ComposerIconButton
            onClick={() => void handleCopy()}
            aria-label={
              copied
                ? locale === "ru"
                  ? "Скопировано"
                  : "Nusxa olindi"
                : locale === "ru"
                  ? "Копировать ответ"
                  : "Javobni nusxalash"
            }
            tone="ghost"
            icon={
              <Icon
                name={copied ? "check" : "copy"}
                size={14}
                className="text-muted-foreground"
              />
            }
          />
        ) : undefined
      }
    >
      {isUser ? (
        message.content
      ) : streaming ? (
        <span
          className="relative"
          role="status"
          aria-live="polite"
          aria-busy
        >
          <StreamingMarkdown content={message.content} isStreaming />
          <span
            className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-px bg-primary animate-caret-blink"
            aria-hidden
          />
        </span>
      ) : (
        <Markdown mode="minimal">{message.content}</Markdown>
      )}
    </ChatMessage>
  );
}
