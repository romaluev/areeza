"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { cn } from "@areeza/ui/lib/utils";
import { Markdown } from "@areeza/ui/markdown";
import { StreamingMarkdown } from "@areeza/ui/markdown/StreamingMarkdown";
import { Icon } from "@areeza/ui/icons";
import type { CaseMessage } from "@areeza/core/types";
import { ComposerIconButton } from "./composer-icon-button";

const BUBBLE_MAX = "max-w-[length:var(--layout-message-bubble-max)]";

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
      toast.message(
        locale === "ru" ? "Скопировано" : "Nusxa olindi",
        { duration: 1500 },
      );
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(locale === "ru" ? "Не удалось скопировать" : "Nusxa olinmadi");
    }
  }, [locale, message.content]);

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div
          className={cn(
            BUBBLE_MAX,
            "select-text rounded-2xl bg-accent px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-accent-foreground shadow-xs",
          )}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex w-full justify-start gap-1">
      <div
        className={cn(
          BUBBLE_MAX,
          "min-w-0 select-text px-2 py-1 text-sm leading-relaxed text-foreground",
          streaming && "relative",
        )}
        role={streaming ? "status" : undefined}
        aria-live={streaming ? "polite" : undefined}
        aria-busy={streaming ? true : undefined}
      >
        {streaming ? (
          <>
            <StreamingMarkdown content={message.content} isStreaming />
            <span
              className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-px bg-primary animate-caret-blink"
              aria-hidden
            />
          </>
        ) : (
          <Markdown mode="minimal">{message.content}</Markdown>
        )}
      </div>
      {!streaming && message.content.trim().length > 0 ? (
        <ComposerIconButton
          className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
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
      ) : null}
    </div>
  );
}
