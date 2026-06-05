import type { IssueSeverity, PipelineStep } from "@areeza/core/types";
import type { AppLocale } from "@/lib/copy";

/**
 * Kanban columns map to the legal pipeline {@link PipelineStep} (Describe → Submit).
 * Class strings are written out in full (no interpolation) so Tailwind v4 emits them.
 */
export const BOARD_STAGES: readonly PipelineStep[] = [
  "describe",
  "classify",
  "route",
  "prepare",
  "validate",
  "submit",
] as const;

export type StageConfig = {
  labelUz: string;
  labelRu: string;
  /** Subtle column background tint. */
  columnBg: string;
  /** Header badge (bg + text). */
  badge: string;
  /** Status dot color. */
  dot: string;
};

export const STAGE_CONFIG: Record<PipelineStep, StageConfig> = {
  describe: {
    labelUz: "Tavsif",
    labelRu: "Описание",
    columnBg: "bg-muted/30",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/70",
  },
  classify: {
    labelUz: "Tasnif",
    labelRu: "Классификация",
    columnBg: "bg-primary/5",
    badge: "bg-primary/15 text-primary",
    dot: "bg-primary",
  },
  route: {
    labelUz: "Yo'nalish",
    labelRu: "Маршрут",
    columnBg: "bg-brand/5",
    badge: "bg-brand/15 text-brand",
    dot: "bg-brand",
  },
  prepare: {
    labelUz: "Tayyorlash",
    labelRu: "Подготовка",
    columnBg: "bg-warn/5",
    badge: "bg-warn/15 text-warn",
    dot: "bg-warn",
  },
  validate: {
    labelUz: "Tekshirish",
    labelRu: "Проверка",
    columnBg: "bg-warning/5",
    badge: "bg-warning/15 text-warning",
    dot: "bg-warning",
  },
  submit: {
    labelUz: "Topshirish",
    labelRu: "Подача",
    columnBg: "bg-success/5",
    badge: "bg-success/15 text-success",
    dot: "bg-success",
  },
};

export function stageLabel(step: PipelineStep, locale: AppLocale): string {
  const cfg = STAGE_CONFIG[step];
  return locale === "ru" ? cfg.labelRu : cfg.labelUz;
}

/** Severity → number of filled bars (urgent-most = 4) + tone for the indicator. */
export const SEVERITY_CONFIG: Record<
  IssueSeverity,
  { bars: number; labelUz: string; labelRu: string; tone: string }
> = {
  critical: { bars: 4, labelUz: "Muhim", labelRu: "Критично", tone: "text-danger" },
  high: { bars: 3, labelUz: "Yuqori", labelRu: "Высокий", tone: "text-warn" },
  medium: { bars: 2, labelUz: "O'rta", labelRu: "Средний", tone: "text-primary" },
  low: { bars: 1, labelUz: "Past", labelRu: "Низкий", tone: "text-muted-foreground" },
};

export function severityLabel(severity: IssueSeverity, locale: AppLocale): string {
  const cfg = SEVERITY_CONFIG[severity];
  return locale === "ru" ? cfg.labelRu : cfg.labelUz;
}
