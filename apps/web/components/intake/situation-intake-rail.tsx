"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, isMockFailureError } from "@areeza/core/api";
import type { CaseFact, CaseMessage, IntakeEvent, SituationMessage } from "@areeza/core/types";
import { MessageList } from "./message-list";
import { PromptBox } from "./prompt-box";
import { ThinkingIndicator } from "./thinking-indicator";
import { FactsPanel } from "@/components/facts/facts-panel";
import { useIntakeStore } from "@/lib/use-intake-store";
import { showRetryToast } from "@/lib/retry-toast";

export function SituationIntakeRail({
  situationId,
  seedText,
  readOnly,
  initialMessages,
}: {
  situationId: string;
  seedText?: string;
  readOnly?: boolean;
  initialMessages?: SituationMessage[];
}) {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const seeded = useRef(false);
  const [input, setInput] = useState("");
  const {
    messages,
    facts,
    addMessage,
    addFact,
    assistantBuffer,
    appendAssistant,
    flushAssistant,
    streaming,
    setStreaming,
    locale,
    setLocale,
    reset,
  } = useIntakeStore();

  const [confirmOptions, setConfirmOptions] = useState<string[] | null>(null);

  useEffect(() => {
    if (initialMessages?.length) {
      reset();
      for (const m of initialMessages) {
        addMessage(m);
      }
    }
  }, [initialMessages, reset, addMessage]);

  const runIntake = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      addMessage({
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      });
      setStreaming(true);
      try {
        for await (const event of api.streamIntake(situationId, text, abortRef.current.signal)) {
          handleEvent(event, {
            appendAssistant,
            flushAssistant,
            addFact,
            setConfirmOptions,
            onDone: (id) => {
              flushAssistant();
              setStreaming(false);
              router.push(`/situations/${id}?from=intake`);
            },
          });
        }
      } catch (e) {
        setStreaming(false);
        if ((e as Error).message !== "Aborted") {
          if (isMockFailureError(e)) {
            showRetryToast("Suhbat uzildi", () => runIntake(text));
          } else {
            toast.error("Suhbat uzildi");
          }
        }
      }
    },
    [situationId, addMessage, appendAssistant, flushAssistant, addFact, setStreaming, router],
  );

  useEffect(() => {
    if (!readOnly && seedText && !seeded.current && messages.length === 0) {
      seeded.current = true;
      void runIntake(seedText);
    }
  }, [readOnly, seedText, messages.length, runIntake]);

  const displayMessages = messages.length ? messages : (initialMessages ?? []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList
          messages={displayMessages}
          locale={locale}
          streaming={streaming}
          assistantBuffer={assistantBuffer}
        />
        {streaming ? <ThinkingIndicator locale={locale} /> : null}
      </div>
      {confirmOptions ? (
        <div className="flex flex-wrap gap-2 border-t border-border p-3">
          {confirmOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-surface-2"
              onClick={() => {
                setConfirmOptions(null);
                setInput(opt);
                void runIntake(opt);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : null}
      {!readOnly ? (
        <PromptBox
          value={input}
          onChange={setInput}
          onSend={() => {
            const t = input.trim();
            if (!t) return;
            setInput("");
            void runIntake(t);
          }}
          disabled={streaming}
          sendDisabled={streaming || !input.trim()}
          locale={locale}
          onLocaleChange={setLocale}
        />
      ) : null}
      <div className="border-t border-border">
        <FactsPanel facts={facts} />
      </div>
    </div>
  );
}

function handleEvent(
  event: IntakeEvent,
  ctx: {
    appendAssistant: (d: string) => void;
    flushAssistant: () => void;
    addFact: (f: CaseFact) => void;
    setConfirmOptions: (o: string[] | null) => void;
    onDone: (id: string) => void;
  },
) {
  switch (event.type) {
    case "assistant_delta":
      ctx.appendAssistant(event.delta);
      break;
    case "question":
      ctx.flushAssistant();
      if (event.options?.length) ctx.setConfirmOptions(event.options);
      break;
    case "fact":
      ctx.addFact(event.fact);
      break;
    case "done":
      ctx.onDone(event.situationId);
      break;
    default:
      break;
  }
}
