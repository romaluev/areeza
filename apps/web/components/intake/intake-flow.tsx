"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, isMockFailureError, persistIntakeSession } from "@areeza/core/api";
import { CATEGORIES } from "@areeza/core/legal";
import type { CategoryCode, LegalArticle } from "@areeza/core/types";
import { withConfidenceLevel } from "@areeza/core/types";
import { Icon } from "@areeza/ui/icons";
import { MessageList } from "./message-list";
import { PromptBox } from "./prompt-box";
import { QuestionBlock } from "./question-block";
import { SourcesCard } from "./sources-card";
import { SuggestedQuestions } from "./suggested-questions";
import { ClassificationBanner } from "./classification-banner";
import { FactsPanel } from "@/components/facts/facts-panel";
import { GUIDED_PROMPTS } from "@/lib/intake-copy";
import { traceRowFromEvent } from "@/lib/intake-trace";
import {
  getIntakeStore,
  NEW_CASE_INTAKE_SURFACE,
  useIntakeStore,
} from "@/lib/use-intake-store";
import { COMPLIANCE_NOTE } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import {
  guardMessage,
  validateIntakeInput,
  INTAKE_MAX_CHARS,
} from "@/lib/intake-guards";
import { INTAKE_DRAFT_KEY, type IntakeDraft } from "@/lib/intake-draft";
import { readStorageJson, removeStorage } from "@/lib/storage";
import { useDebouncedAutosave } from "@/lib/use-debounced-autosave";
import { showRetryToast } from "@/lib/retry-toast";

const INTAKE_SURFACE = NEW_CASE_INTAKE_SURFACE;

export function IntakeFlow({ seedText }: { seedText?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [input, setInput] = useState(seedText ?? "");
  const [guardHint, setGuardHint] = useState<string | null>(null);
  const [awaitingCategory, setAwaitingCategory] = useState(false);
  const [pendingCaseId, setPendingCaseId] = useState<string | null>(null);
  const [questionOptions, setQuestionOptions] = useState<{
    question: string;
    options: string[];
  } | null>(null);
  const [sources, setSources] = useState<{
    articles: LegalArticle[];
    prompt: string;
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);
  const lastRunTextRef = useRef<string | null>(null);
  const draftRestoredRef = useRef(false);

  const { locale } = useAppLocale();
  const {
    messages,
    facts,
    traces,
    streaming,
    assistantBuffer,
    classification,
    addMessage,
    appendAssistant,
    flushAssistant,
    addFact,
    addTrace,
    resetTraces,
    setClassification,
    setStreaming,
    reset,
  } = useIntakeStore(INTAKE_SURFACE);

  const draftDirty =
    messages.length > 0 ||
    facts.length > 0 ||
    input.trim().length > 0 ||
    streaming;

  const { clear: clearIntakeDraft } = useDebouncedAutosave<IntakeDraft>({
    storageKey: INTAKE_DRAFT_KEY,
    enabled: true,
    dirty: draftDirty,
    value: {
      locale,
      messages,
      facts,
      classification,
      input,
      pendingCaseId,
      savedAt: new Date().toISOString(),
    },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      reset();
    };
  }, [reset]);

  useEffect(() => {
    if (draftRestoredRef.current || messages.length > 0) return;
    const draft = readStorageJson<IntakeDraft>(INTAKE_DRAFT_KEY);
    if (!draft?.messages?.length) return;
    draftRestoredRef.current = true;
    queueMicrotask(() => {
      getIntakeStore(INTAKE_SURFACE).setState({
        locale: draft.locale,
        messages: draft.messages,
        facts: draft.facts,
        classification: draft.classification,
        assistantBuffer: "",
        streaming: false,
      });
      setInput(draft.input ?? "");
      setPendingCaseId(draft.pendingCaseId);
      if (draft.classification?.needsCategoryPick || draft.pendingCaseId) {
        setAwaitingCategory(true);
      }
      toast.message(
        draft.locale === "ru" ? "Черновик восстановлен" : "Qoralama tiklandi",
        {
          description:
            draft.locale === "ru"
              ? "Можно продолжить с того же места."
              : "Oxirgi holatdan davom etishingiz mumkin.",
        },
      );
    });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [pathname]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    flushAssistant();
    setStreaming(false);
    submittingRef.current = false;
  }, [flushAssistant, setStreaming]);

  const finishCase = useCallback(
    (caseId: string) => {
      const store = getIntakeStore(INTAKE_SURFACE).getState();
      const cls = store.classification;
      if (cls) {
        persistIntakeSession(caseId, store.messages, store.facts, cls);
      }
      clearIntakeDraft();
      removeStorage(INTAKE_DRAFT_KEY);
      abortRef.current?.abort();
      toast.success(
        locale === "ru" ? "Классификация завершена" : "Tasniflash yakunlandi",
      );
      router.push(`/situations/${caseId}?from=intake`);
    },
    [clearIntakeDraft, locale, router],
  );

  const runIntake = useCallback(
    async (text: string) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setGuardHint(null);
      setAwaitingCategory(false);
      setPendingCaseId(null);
      setQuestionOptions(null);
      setSources(null);
      resetTraces();
      lastRunTextRef.current = text;

      setStreaming(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      addMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      });

      try {
        for await (const event of api.streamIntake(
          undefined,
          text,
          abortRef.current.signal,
        )) {
          const row = traceRowFromEvent(event, locale);
          if (row) addTrace(row);
          switch (event.type) {
            case "assistant_delta":
              appendAssistant(event.delta);
              break;
            case "question":
              flushAssistant();
              addMessage({
                id: `q-${Date.now()}`,
                role: "assistant",
                content: event.question,
                createdAt: new Date().toISOString(),
              });
              if (event.options?.length) {
                setQuestionOptions({
                  question: event.question,
                  options: event.options,
                });
              }
              break;
            case "fact":
              addFact(event.fact);
              break;
            case "sources_proposed":
              flushAssistant();
              setSources({ articles: event.articles, prompt: event.prompt });
              break;
            case "error":
              flushAssistant();
              setStreaming(false);
              toast.error(
                locale === "ru"
                  ? `Ошибка: ${event.message}`
                  : `Xato: ${event.message}`,
              );
              break;
            case "classified":
              flushAssistant();
              setClassification(event.classification);
              break;
            case "done": {
              setStreaming(false);
              const cls = getIntakeStore(INTAKE_SURFACE).getState().classification;
              if (!cls) {
                toast.error(
                  locale === "ru"
                    ? "Не удалось классифицировать — попробуйте переформулировать"
                    : "Tasniflab bo'lmadi — boshqacharoq yozib ko'ring",
                );
                break;
              }
              if (cls.needsCategoryPick || cls.confidenceLevel === "low") {
                setAwaitingCategory(true);
                setPendingCaseId(event.situationId ?? event.caseId ?? null);
                break;
              }
              finishCase(event.situationId ?? event.caseId ?? "");
              break;
            }
          }
        }
      } catch (e) {
        if ((e as Error).message === "Aborted") return;
        const msg =
          locale === "ru" ? "Ошибка при приёме" : "Murojaatda xatolik";
        if (isMockFailureError(e) && lastRunTextRef.current) {
          showRetryToast(msg, () => runIntake(lastRunTextRef.current!), undefined);
        } else {
          toast.error(msg);
        }
      } finally {
        setStreaming(false);
        submittingRef.current = false;
      }
    },
    [
      addFact,
      addMessage,
      addTrace,
      appendAssistant,
      flushAssistant,
      finishCase,
      locale,
      resetTraces,
      setClassification,
      setStreaming,
    ],
  );

  const handleSend = useCallback(() => {
    if (streaming || submittingRef.current) return;

    const guard = validateIntakeInput(input);
    if (!guard.ok && guard.reason) {
      setGuardHint(guardMessage(guard.reason, locale));
      return;
    }

    const text =
      guard.trimmed.length > INTAKE_MAX_CHARS
        ? guard.trimmed.slice(0, INTAKE_MAX_CHARS)
        : guard.trimmed;

    setGuardHint(null);
    void runIntake(text);
  }, [input, locale, runIntake, streaming]);

  const handleSuggestedPick = useCallback(
    (text: string) => {
      if (streaming || submittingRef.current) return;
      setInput(text);
      const guard = validateIntakeInput(text);
      if (guard.ok) {
        setGuardHint(null);
        void runIntake(guard.trimmed);
      }
    },
    [runIntake, streaming],
  );

  const handleCategoryPick = useCallback(
    (code: CategoryCode) => {
      const cat = CATEGORIES.find((c) => c.code === code);
      if (!cat) return;
      setClassification(
        withConfidenceLevel({
          categoryCode: code,
          label: locale === "ru" ? cat.labelRu : cat.labelUz,
          confidence: 0.92,
          track: code === "family.child_support" ? "court_order" : "claim",
          trackLabel:
            locale === "ru"
              ? code === "family.child_support"
                ? "Приказное производство"
                : "Исковое производство"
              : code === "family.child_support"
                ? "Sud buyrug'i tartibi"
                : "Da'vo tartibi",
          trackRationale:
            locale === "ru"
              ? "Категория выбрана вручную."
              : "Toifa foydalanuvchi tanlovi bilan aniqlashtirildi.",
          needsCategoryPick: false,
        }),
      );
      setAwaitingCategory(false);
      if (pendingCaseId) finishCase(pendingCaseId);
    },
    [locale, setClassification, pendingCaseId, finishCase],
  );

  const handleContinueAfterPick = useCallback(() => {
    if (pendingCaseId) finishCase(pendingCaseId);
  }, [finishCase, pendingCaseId]);

  const guard = validateIntakeInput(input);
  const sendDisabled = !guard.ok || streaming;
  const showHero = messages.length === 0 && !streaming && !assistantBuffer;

  const composer = (
    <PromptBox
      heroLayout={showHero}
      value={input}
      onChange={(v) => {
        setInput(v);
        if (guardHint) setGuardHint(null);
      }}
      onSend={handleSend}
      disabled={streaming}
      sendDisabled={sendDisabled}
      locale={locale}
      guardHint={guardHint}
      pending={streaming}
      onStop={stopStreaming}
    />
  );

  // Clean, centered "blank window" start screen — a heading and the composer in the
  // middle, with example prompts below (the new-situation first step).
  if (showHero) {
    return (
      <div className="flex h-[calc(100dvh-0px)] flex-col p-4 md:p-6">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/30 text-accent-foreground">
              <Icon name="scale" size="lg" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {locale === "ru" ? "Что произошло?" : "Nima bo'ldi?"}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {locale === "ru"
                  ? "Опишите ситуацию простыми словами — Areeza задаст один уточняющий вопрос за раз и подготовит документ для суда."
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
        <p className="text-center text-[11px] text-muted-foreground">
          {COMPLIANCE_NOTE[locale]}
        </p>
      </div>
    );
  }

  // Conversation layout — transcript + facts rail.
  return (
    <div className="flex h-[calc(100dvh-0px)] flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {locale === "ru" ? "Что произошло?" : "Nima bo'ldi?"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "ru"
            ? "Опишите проблему простыми словами — Areeza задаёт один вопрос за раз."
            : "Muammoingizni oddiy tilda yozing — Areeza bir vaqtning o'zida bitta savol beradi."}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-col gap-3 lg:max-w-none">
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card p-3 md:p-4">
            <MessageList
              messages={messages}
              streaming={streaming}
              assistantBuffer={assistantBuffer}
              traces={traces}
              locale={locale}
              onSuggestedPick={handleSuggestedPick}
              streamDisabled={streaming}
            />
          </div>

          {sources ? (
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
          ) : null}

          {questionOptions ? (
            <QuestionBlock
              question={questionOptions.question}
              options={questionOptions.options}
              onAnswer={(text) => {
                setQuestionOptions(null);
                void runIntake(text);
              }}
              disabled={streaming}
              locale={locale}
            />
          ) : null}

          {classification && (awaitingCategory || classification.needsCategoryPick) ? (
            <ClassificationBanner
              classification={classification}
              locale={locale}
              awaitingPick={awaitingCategory}
              onCategoryPick={handleCategoryPick}
              onContinue={
                pendingCaseId ? handleContinueAfterPick : undefined
              }
            />
          ) : classification ? (
            <ClassificationBanner
              classification={classification}
              locale={locale}
              awaitingPick={false}
              onCategoryPick={handleCategoryPick}
              onContinue={pendingCaseId ? handleContinueAfterPick : undefined}
            />
          ) : null}

          {composer}
        </div>
        <FactsPanel facts={facts} />
      </div>

      <p className="text-[11px] text-muted-foreground">{COMPLIANCE_NOTE[locale]}</p>
    </div>
  );
}
