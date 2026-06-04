export const INTAKE_MIN_CHARS = 12;
export const INTAKE_MAX_CHARS = 2000;

const GIBBERISH_RE = /^[\s\d\W]+$/;
const REPEAT_RE = /(.)\1{5,}/;

export type IntakeGuardReason =
  | "empty"
  | "short"
  | "long"
  | "gibberish"
  | null;

export type IntakeGuardResult = {
  ok: boolean;
  reason: IntakeGuardReason;
  trimmed: string;
};

export function validateIntakeInput(raw: string): IntakeGuardResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty", trimmed };
  }
  if (trimmed.length < INTAKE_MIN_CHARS) {
    return { ok: false, reason: "short", trimmed };
  }
  if (trimmed.length > INTAKE_MAX_CHARS) {
    return { ok: false, reason: "long", trimmed };
  }
  const letters = trimmed.replace(/[^\p{L}]/gu, "");
  if (letters.length < 6) {
    return { ok: false, reason: "gibberish", trimmed };
  }
  if (
    GIBBERISH_RE.test(trimmed) ||
    REPEAT_RE.test(trimmed) ||
    (trimmed.length < 30 && /^[a-z0-9\s]+$/i.test(trimmed) && !/\s/.test(trimmed.slice(1)))
  ) {
    return { ok: false, reason: "gibberish", trimmed };
  }
  return { ok: true, reason: null, trimmed };
}

export function guardMessage(
  reason: IntakeGuardReason,
  locale: "uz" | "ru",
): string | null {
  if (!reason) return null;
  const uz: Record<Exclude<IntakeGuardReason, null>, string> = {
    empty: "Muammoingizni yozing — bo'sh yuborib bo'lmaydi.",
    short: "Biroz batafsil yozing (kamida 12 belgi).",
    long: "Matn juda uzun — 2000 belgigacha qisqartiring.",
    gibberish: "Matn tushunarli emas. Oddiy tilda muammoingizni yozing.",
  };
  const ru: Record<Exclude<IntakeGuardReason, null>, string> = {
    empty: "Опишите проблему — пустое сообщение отправить нельзя.",
    short: "Напишите чуть подробнее (минимум 12 символов).",
    long: "Слишком длинный текст — сократите до 2000 символов.",
    gibberish: "Текст непонятен. Опишите проблему простыми словами.",
  };
  return (locale === "ru" ? ru : uz)[reason];
}
