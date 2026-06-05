"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, isMockFailureError } from "@areeza/core/api";
import type { CaseFact, IntakeEvent, SituationMessage } from "@areeza/core/types";
import { MessageList } from "./message-list";
import { PromptBox } from "./prompt-box";
import { SuggestedQuestions } from "./suggested-questions";
import { FactsPanel } from "@/components/facts/facts-panel";
import {
  getIntakeStore,
  situationIntakeSurface,
  useIntakeStore,
} from "@/lib/use-intake-store";
import { useAppLocale } from "@/lib/use-app-locale";
import { validateIntakeInput } from "@/lib/intake-guards";
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
  const surface = useMemo(() => situationIntakeSurface(situationId), [situationId]);
  const abortRef = useRef<AbortController | null>(null);
  const seeded = useRef(false);
  const lastRunTextRef = useRef<string | null>(null);
  const [input, setInput] = useState("");
  const { locale } = useAppLocale();
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
    reset,
  } = useIntakeStore(surface);

  const [confirmOptions, setConfirmOptions] = useState<string[] | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      reset();
    };
  }, [reset]);

  useEffect(() => {
    if (initialMessages?.length) {
      reset();
      for (const m of initialMessages) {
        addMessage(m);
      }
    }
  }, [initialMessages, reset, addMessage]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    flushAssistant();
    setStreaming(false);
  }, [flushAssistant, setStreaming]);

  const runIntake = useCallback(
    async (text: string) => {
      if (getIntakeStore(surface).getState().streaming) return;
      lastRunTextRef.current = text;
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
          if (isMockFailureError(e) && lastRunTextRef.current) {
            showRetryToast("Suhbat uzildi", () => runIntake(lastRunTextRef.current!));
          } else {
            toast.error("Suhbat uzildi");
          }
        }
      } finally {
        setStreaming(false);
      }
    },
    [
      situationId,
      addMessage,
      appendAssistant,
      flushAssistant,
      addFact,
      setStreaming,
      router,
      surface,
    ],
  );

  useEffect(() => {
    if (!readOnly && seedText && !seeded.current && messages.length === 0) {
      seeded.current = true;
      void runIntake(seedText);
    }
  }, [readOnly, seedText, messages.length, runIntake]);

  const handleSuggestedPick = useCallback(
    (text: string) => {
      if (streaming) return;
      const guard = validateIntakeInput(text);
      if (!guard.ok) return;
      setInput("");
      void runIntake(guard.trimmed);
    },
    [runIntake, streaming],
  );

  const displayMessages = messages.length ? messages : (initialMessages ?? []);
  const showEmptyHero =
    !readOnly && displayMessages.length === 0 && !assistantBuffer;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-3xl px-4 lg:px-6">
          <MessageList
            messages={displayMessages}
            locale={locale}
            streaming={streaming}
            assistantBuffer={assistantBuffer}
            onSuggestedPick={showEmptyHero ? handleSuggestedPick : undefined}
            streamDisabled={streaming}
            heroVariant="chips-only"
          />
        </div>
      </div>
      {confirmOptions ? (
        <div className="mx-auto w-full max-w-3xl px-4 pb-2 lg:px-6">
          <SuggestedQuestions
            prompts={confirmOptions.map((text, i) => ({
              id: `confirm-${i}`,
              text,
            }))}
            onPick={(text) => {
              setConfirmOptions(null);
              void runIntake(text);
            }}
            disabled={streaming}
            layout="stack"
          />
        </div>
      ) : null}
      {!readOnly ? (
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 lg:px-6">
          <PromptBox
            value={input}
            onChange={setInput}
            onSend={() => {
              const guard = validateIntakeInput(input);
              if (!guard.ok || streaming) return;
              setInput("");
              void runIntake(guard.trimmed);
            }}
            disabled={streaming}
            sendDisabled={streaming || !input.trim()}
            locale={locale}
            pending={streaming}
            onStop={stopStreaming}
          />
        </div>
      ) : null}
      {facts.length > 0 ? (
        <div className="border-t border-border">
          <FactsPanel facts={facts} />
        </div>
      ) : null}
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
