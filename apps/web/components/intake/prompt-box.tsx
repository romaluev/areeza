"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@areeza/ui/icons";
import { cn } from "@areeza/ui/lib/utils";
import { INTAKE_MAX_CHARS } from "@/lib/intake-guards";
import { ComposerIconButton } from "./composer-icon-button";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  sendDisabled?: boolean;
  locale: "uz" | "ru";
  guardHint?: string | null;
  heroLayout?: boolean;
  pending?: boolean;
  onStop?: () => void;
};

export function PromptBox({
  value,
  onChange,
  onSend,
  disabled,
  sendDisabled,
  locale,
  guardHint,
  heroLayout,
  pending,
  onStop,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [compact, setCompact] = useState(false);
  const overMax = value.length > INTAKE_MAX_CHARS;
  const hasContent = value.trim().length > 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(([entry]) => {
      if (entry) setCompact(entry.contentRect.width < 460);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, heroLayout ? 240 : 160)}px`;
  }, [heroLayout]);

  useEffect(() => {
    autoGrow();
  }, [value, autoGrow]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendDisabled && !disabled) onSend();
    }
  }

  const placeholder =
    locale === "ru"
      ? "Например: Работодатель 2 месяца не платит зарплату…"
      : "Masalan: Ish beruvchim 2 oydan beri oyligimni to'lamayapti…";

  const textareaLabel =
    locale === "ru"
      ? "Опишите ситуацию простыми словами"
      : "Vaziyatingizni oddiy tilda yozing";

  return (
    <div
      ref={containerRef}
      className={cn(
        "raisedSurface flex w-full flex-col border transition-colors duration-200",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 motion-reduce:transition-none",
        compact ? "p-2" : "p-2.5",
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled || pending}
        maxLength={INTAKE_MAX_CHARS}
        aria-label={textareaLabel}
        aria-invalid={!!guardHint || overMax}
        aria-describedby={guardHint ? "intake-guard-hint" : undefined}
        className={cn(
          "w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none",
          heroLayout ? "px-1.5 py-1.5" : "px-1.5 py-1",
        )}
      />
      <div className="mt-1 flex select-none flex-col gap-1.5">
        {guardHint ? (
          <p id="intake-guard-hint" className="px-1.5 text-xs text-warn" role="alert">
            {guardHint}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center">
          <span className="truncate px-1.5 text-[11px] text-muted-foreground">
            {locale === "ru" ? "Enter — отправить" : "Enter — yuborish"}
          </span>
        </div>
        <div className={cn("ml-auto flex shrink-0 items-center", compact ? "gap-0.5" : "gap-1")}>
          {pending && onStop ? (
            <ComposerIconButton
              onClick={onStop}
              aria-label={locale === "ru" ? "Остановить" : "To'xtatish"}
              tone="danger"
              icon={<Icon name="stop" size={14} />}
            />
          ) : null}
          <ComposerIconButton
            onClick={onSend}
            disabled={disabled || sendDisabled}
            tone={hasContent && !sendDisabled && !disabled ? "filled" : "ghost"}
            aria-label={locale === "ru" ? "Отправить" : "Yuborish"}
            icon={
              pending ? (
                <Icon name="loading" size={14} className="animate-spin" />
              ) : (
                <Icon name="arrowUp" size={14} />
              )
            }
          />
        </div>
        </div>
      </div>
    </div>
  );
}
