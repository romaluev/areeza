"use client";

import {
  useCallback,
  useEffect,
  useRef as _useRef,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Icon } from "@areeza/ui/icons";
import { cn } from "@areeza/ui/lib/utils";
import { INTAKE_MAX_CHARS } from "@/lib/intake-guards";
import { ComposerIconButton } from "./composer-icon-button";

void _useRef;

const ACCEPT = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.heic";

type Attachment = { id: string; file: File; preview?: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  /** Receives an optional note listing attachments to append to the message. */
  onSend: (attachmentNote?: string) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compact, setCompact] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const overMax = value.length > INTAKE_MAX_CHARS;
  const hasContent = value.trim().length > 0 || attachments.length > 0;
  const canSend = hasContent && !sendDisabled && !disabled;

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

  // Revoke object URLs on unmount.
  useEffect(() => {
    return () => {
      setAttachments((prev) => {
        prev.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
        return prev;
      });
    };
  }, []);

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const next: Attachment[] = [];
    for (const file of Array.from(list)) {
      const isImage = file.type.startsWith("image/");
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        preview: isImage ? URL.createObjectURL(file) : undefined,
      });
    }
    setAttachments((prev) => {
      const seen = new Set(prev.map((a) => a.id));
      return [...prev, ...next.filter((a) => !seen.has(a.id))];
    });
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((a) => a.id !== id);
    });
  }

  function submit() {
    if (!canSend) return;
    const note =
      attachments.length > 0
        ? `\n\n[${locale === "ru" ? "Вложения" : "Ilovalar"}: ${attachments
            .map((a) => a.file.name)
            .join(", ")}]`
        : undefined;
    attachments.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
    setAttachments([]);
    onSend(note);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
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
        maxLength={INTAKE_MAX_CHARS}
        aria-label={textareaLabel}
        aria-invalid={!!guardHint || overMax}
        aria-describedby={guardHint ? "intake-guard-hint" : undefined}
        className={cn(
          "w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none",
          heroLayout ? "px-1.5 py-1.5" : "px-1.5 py-1",
        )}
      />

      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-1.5 pb-1 pt-1.5">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="group relative flex items-center gap-2 rounded-lg border border-border bg-background/60 py-1 pl-1 pr-2"
            >
              {a.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.preview}
                  alt={a.file.name}
                  className="size-8 rounded-md object-cover"
                />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon name="file" size={16} />
                </span>
              )}
              <span className="max-w-[140px] truncate text-xs text-foreground">
                {a.file.name}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                aria-label={locale === "ru" ? "Удалить" : "O'chirish"}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon name="cancel" size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-1 flex select-none flex-col gap-1.5">
        {guardHint ? (
          <p id="intake-guard-hint" className="px-1.5 text-xs text-warn" role="alert">
            {guardHint}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <div className={cn("flex items-center", compact ? "gap-0.5" : "gap-1")}>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <ComposerIconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              tone="ghost"
              aria-label={locale === "ru" ? "Прикрепить файл" : "Fayl biriktirish"}
              title={
                locale === "ru"
                  ? "Прикрепить файлы или изображения"
                  : "Fayl yoki rasm biriktirish"
              }
              icon={<Icon name="attach" size={16} />}
            />
            <ComposerIconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              tone="ghost"
              aria-label={locale === "ru" ? "Добавить изображение" : "Rasm qo'shish"}
              icon={<Icon name="image" size={16} />}
            />
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
              onClick={submit}
              disabled={!canSend}
              tone={canSend ? "filled" : "ghost"}
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
