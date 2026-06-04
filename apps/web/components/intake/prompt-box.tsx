"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { Icon } from "@areeza/ui/icons";
import { Button } from "@areeza/ui/components/button";
import { Textarea } from "@areeza/ui/components/textarea";
import { Segmented } from "@areeza/ui/components/segmented";
import { cn } from "@areeza/ui/lib/utils";
import { INTAKE_MAX_CHARS } from "@/lib/intake-guards";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  sendDisabled?: boolean;
  locale: "uz" | "ru";
  onLocaleChange: (l: "uz" | "ru") => void;
  guardHint?: string | null;
  charCount?: number;
};

export function PromptBox({
  value,
  onChange,
  onSend,
  disabled,
  sendDisabled,
  locale,
  onLocaleChange,
  guardHint,
  charCount,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const count = charCount ?? value.length;
  const overMax = count > INTAKE_MAX_CHARS;

  const autoGrow = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

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

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-sm">
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        maxLength={INTAKE_MAX_CHARS + 200}
        aria-invalid={!!guardHint || overMax}
        aria-describedby={guardHint ? "intake-guard-hint" : undefined}
        className="min-h-[44px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      {guardHint ? (
        <p
          id="intake-guard-hint"
          className="px-2 pb-1 text-xs text-[var(--warn)]"
          role="alert"
        >
          {guardHint}
        </p>
      ) : null}
      <div className="mt-1 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Segmented
            value={locale}
            onValueChange={(v) => onLocaleChange(v as "uz" | "ru")}
            layoutId="intake-locale"
            aria-label={locale === "ru" ? "Язык" : "Til"}
            options={[
              { value: "uz", label: "UZ" },
              { value: "ru", label: "RU" },
            ]}
          />
          <Icon
            name="languages"
            size={14}
            className="text-[var(--muted-foreground)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px] tabular-nums text-[var(--muted-foreground)]",
              overMax && "text-[var(--danger)]",
            )}
          >
            {count}/{INTAKE_MAX_CHARS}
          </span>
          <Button
            size="sm"
            disabled={disabled || sendDisabled}
            onClick={onSend}
            className="gap-1"
          >
            {locale === "ru" ? "Отправить" : "Yuborish"}
            <Icon name="arrowUp" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
