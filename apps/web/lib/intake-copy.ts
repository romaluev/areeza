import type { ConfidenceLevel } from "@areeza/core/types";

export const GUIDED_PROMPTS: Record<
  "uz" | "ru",
  { id: string; text: string }[]
> = {
  uz: [
    {
      id: "wage",
      text: "Ish beruvchim 2 oydan beri oyligimni to'lamayapti.",
    },
    {
      id: "dismiss",
      text: "Men ish joyimdan noqonuniy ravishda bo'shatildim.",
    },
    {
      id: "debt",
      text: "Qarzimni qaytarmayapti, shartnoma bor.",
    },
    {
      id: "consumer",
      text: "Xizmat sifatsiz bajarildi, pulni qaytarmoqchiman.",
    },
  ],
  ru: [
    {
      id: "wage",
      text: "Работодатель 2 месяца не платит зарплату.",
    },
    {
      id: "dismiss",
      text: "Меня незаконно уволили с работы.",
    },
    {
      id: "debt",
      text: "Не возвращают долг, есть договор.",
    },
    {
      id: "consumer",
      text: "Услугу выполнили плохо, хочу вернуть деньги.",
    },
  ],
};

export function confidencePill(
  level: ConfidenceLevel,
  locale: "uz" | "ru",
): { label: string; tone: "success" | "warn" | "danger" } {
  const uz = {
    high: { label: "Aniq tasnif", tone: "success" as const },
    medium: { label: "Taxminiy — tasdiqlang", tone: "warn" as const },
    low: { label: "Aniqlanmadi", tone: "danger" as const },
  };
  const ru = {
    high: { label: "Точная классификация", tone: "success" as const },
    medium: { label: "Предположительно — подтвердите", tone: "warn" as const },
    low: { label: "Не определено", tone: "danger" as const },
  };
  return (locale === "ru" ? ru : uz)[level];
}
