"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { Icon } from "@areeza/ui/icons";
import { Button } from "@areeza/ui/components/button";
import { Textarea } from "@areeza/ui/components/textarea";
import { cn } from "@areeza/ui/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  locale: "uz" | "ru";
  onLocaleChange: (l: "uz" | "ru") => void;
};

export function PromptBox({
  value,
  onChange,
  onSend,
  disabled,
  locale,
  onLocaleChange,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

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
      if (value.trim() && !disabled) onSend();
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
        className="min-h-[44px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <div className="mt-1 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={locale === "uz" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onLocaleChange("uz")}
          >
            UZ
          </Button>
          <Button
            type="button"
            variant={locale === "ru" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onLocaleChange("ru")}
          >
            RU
          </Button>
          <Icon
            name="languages"
            size={14}
            className="ml-1 text-[var(--muted-foreground)]"
          />
        </div>
        <Button
          size="sm"
          disabled={disabled || !value.trim()}
          onClick={onSend}
          className="gap-1"
        >
          Yuborish
          <Icon name="arrowUp" size={14} />
        </Button>
      </div>
    </div>
  );
}
