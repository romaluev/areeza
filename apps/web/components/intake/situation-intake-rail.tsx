"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, isMockFailureError } from "@areeza/core/api";
import type {
  CaseFact,
  IntakeEvent,
  LegalArticle,
  SituationMessage,
} from "@areeza/core/types";
import { Icon } from "@areeza/ui/icons";
import { MessageList } from "./message-list";
import { PromptBox } from "./prompt-box";
import { QuestionBlock } from "./question-block";
import { SourcesCard } from "./sources-card";
import { SuggestedQuestions } from "./suggested-questions";
import { GUIDED_PROMPTS } from "@/lib/intake-copy";

type SourcesState = { articles: LegalArticle[]; prompt: string };
import { FactsPanel } from "@/components/facts/facts-panel";
import { traceRowFromEvent, type IntakeTrace } from "@/lib/intake-trace";
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
  const seededMessages = useRef(false);
  const lastRunTextRef = useRef<string | null>(null);
  const [input, setInput] = useState("");
  const { locale } = useAppLocale();
  const {
    messages,
    facts,
    traces,
    addMessage,
    addFact,
    addTrace,
    resetTraces,
    assistantBuffer,
    appendAssistant,
    flushAssistant,
    streaming,
    setStreaming,
  } = useIntakeStore(surface);

  const [confirmOptions, setConfirmOptions] = useState<{
    question: string;
    options: string[];
  } | null>(null);
  const [sources, setSources] = useState<SourcesState | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Seed the persistent per-situation surface only when it's empty, so the
  // conversation survives moving between workspace steps (and is shared by the
  // canvas chat instance and the assistant rail instance).
  useEffect(() => {
    if (seededMessages.current) return;
    if (initialMessages?.length && messages.length === 0) {
      seededMessages.current = true;
      for (const m of initialMessages) {
        addMessage(m);
      }
    }
  }, [initialMessages, addMessage, messages.length]);

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
      setConfirmOptions(null);
      setSources(null);
      resetTraces();
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
            locale,
            appendAssistant,
            flushAssistant,
            addFact,
            addTrace,
            setConfirmOptions,
            setSources,
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
      locale,
      addMessage,
      appendAssistant,
      flushAssistant,
      addFact,
      addTrace,
      resetTraces,
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

  const composer = (
    <PromptBox
      heroLayout={showEmptyHero}
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
  );

  // Empty state: a clean, vertically-centered "blank window" — the composer in the
  // middle with example prompts beneath it (the new-situation first step).
  if (showEmptyHero) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/30 text-accent-foreground">
              <Icon name="scale" size="lg" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {locale === "ru" ? "Что произошло?" : "Nima bo'ldi?"}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {locale === "ru"
                  ? "Опишите ситуацию простыми словами — Areeza задаст один вопрос за раз и подготовит документ для суда."
                  : "Muammoingizni oddiy tilda yozing — Areeza bir vaqtning o'zida bitta savol beradi va sud uchun hujjat tayyorlaydi."}
              </p>
            </div>
            <div className="w-full text-left">{composer}</div>
            <SuggestedQuestions
              prompts={GUIDED_PROMPTS[locale]}
              onPick={handleSuggestedPick}
              disabled={streaming}
              title=""
              className="w-full max-w-lg"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-3xl px-4 lg:px-6">
          <MessageList
            messages={displayMessages}
            locale={locale}
            streaming={streaming}
            assistantBuffer={assistantBuffer}
            traces={traces}
            streamDisabled={streaming}
            heroVariant="chips-only"
          />
        </div>
      </div>
      {sources ? (
        <div className="mx-auto w-full max-w-3xl px-4 pb-2 lg:px-6">
          <SourcesCard
            articles={sources.articles}
            prompt={sources.prompt}
            disabled={streaming}
            locale={locale}
            onConfirm={() => {
              setSources(null);
              void runIntake(locale === "ru" ? "Подтверждаю" : "Tasdiqlayman");
            }}
            onEdit={() => setSources(null)}
          />
        </div>
      ) : null}
      {confirmOptions ? (
        <div className="mx-auto w-full max-w-3xl px-4 pb-2 lg:px-6">
          <QuestionBlock
            question={confirmOptions.question}
            options={confirmOptions.options}
            onAnswer={(text) => {
              setConfirmOptions(null);
              void runIntake(text);
            }}
            disabled={streaming}
            locale={locale}
          />
        </div>
      ) : null}
      {!readOnly ? (
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 lg:px-6">{composer}</div>
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
    locale: "uz" | "ru";
    appendAssistant: (d: string) => void;
    flushAssistant: () => void;
    addFact: (f: CaseFact) => void;
    addTrace: (t: IntakeTrace) => void;
    setConfirmOptions: (o: { question: string; options: string[] } | null) => void;
    setSources: (s: SourcesState | null) => void;
    onDone: (id: string) => void;
  },
) {
  const row = traceRowFromEvent(event, ctx.locale);
  if (row) ctx.addTrace(row);
  switch (event.type) {
    case "assistant_delta":
      ctx.appendAssistant(event.delta);
      break;
    case "question":
      ctx.flushAssistant();
      if (event.options?.length) {
        ctx.setConfirmOptions({
          question: event.question,
          options: event.options,
        });
      }
      break;
    case "fact":
      ctx.addFact(event.fact);
      break;
    case "sources_proposed":
      ctx.flushAssistant();
      ctx.setSources({ articles: event.articles, prompt: event.prompt });
      break;
    case "error":
      ctx.flushAssistant();
      toast.error(
        ctx.locale === "ru" ? `Ошибка: ${event.message}` : `Xato: ${event.message}`,
      );
      break;
    case "done":
      ctx.onDone(event.situationId);
      break;
    default:
      break;
  }
}
