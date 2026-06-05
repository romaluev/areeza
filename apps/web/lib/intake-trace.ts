import type { IntakeEvent } from "@areeza/core/types";
import type { IconName } from "@areeza/ui/lib/ff/icons";

export type IntakeLocale = "uz" | "ru";

/** A single derived row in the intake "thinking" trace panel. */
export type IntakeTrace = {
  id: string;
  label: string;
  icon?: IconName;
};

/** Bilingual `"{prefix}: {value}"` builder for a trace row. */
function row(uz: string, ru: string, value: string, locale: IntakeLocale): string {
  const prefix = locale === "ru" ? ru : uz;
  return value ? `${prefix}: ${value}` : prefix;
}

/** Friendly name for which classifier tier ran (on-device first, Claude as backup). */
function engineLabel(engine: string | undefined, locale: IntakeLocale): string {
  switch (engine) {
    case "tier1":
      return locale === "ru" ? "на устройстве (bge-m3)" : "qurilmada (bge-m3)";
    case "tier2":
      return locale === "ru" ? "на устройстве (LoRA)" : "qurilmada (LoRA)";
    case "claude":
      return locale === "ru" ? "Claude (резерв)" : "Claude (zaxira)";
    case "keyword":
      return locale === "ru" ? "правила" : "qoidalar";
    default:
      return "";
  }
}

/**
 * Derive a trace-panel row from a streamed intake event. Returns `null` for
 * events that are not surfaced as trace rows (assistant text, questions,
 * the terminal `done`, etc.). Pure: no store access — callers append the row
 * via `addTrace`. This is intentionally where the rich pipeline events the
 * new-case flow otherwise drops (`issue_identified`, `party_added`, …) get
 * consumed.
 */
export function traceRowFromEvent(
  event: IntakeEvent,
  locale: IntakeLocale,
): IntakeTrace | null {
  switch (event.type) {
    case "fact":
      return {
        id: `trace-fact-${event.fact.key}`,
        icon: "file",
        label: row("Ma'lumot yozildi", "Записан факт", event.fact.label, locale),
      };
    case "classified": {
      const engine = engineLabel(event.classification.engine, locale);
      return {
        id: "trace-classified",
        icon: "sparkles",
        label:
          row("Yo'nalish aniqlandi", "Классификация", event.classification.label, locale) +
          (engine ? ` · ${engine}` : ""),
      };
    }
    case "sources_proposed":
      return {
        id: "trace-sources",
        icon: "search",
        label: row(
          "Qonun moddalari topildi",
          "Найдены статьи закона",
          `${event.articles.length}`,
          locale,
        ),
      };
    case "issue_identified":
      return {
        id: `trace-issue-${event.issue.id}`,
        icon: "check",
        label: row("Masala aniqlandi", "Выявлена задача", event.issue.title, locale),
      };
    case "party_added":
      return {
        id: `trace-party-${event.party.id}`,
        icon: "dot",
        label: row("Tomon qo'shildi", "Добавлена сторона", event.party.name, locale),
      };
    case "evidence_logged":
      return {
        id: `trace-evidence-${event.evidence.id}`,
        icon: "file",
        label: row(
          "Dalil qayd etildi",
          "Зафиксировано доказательство",
          event.evidence.title,
          locale,
        ),
      };
    case "timeline_event":
      return {
        id: `trace-timeline-${event.event.id}`,
        icon: "dot",
        label: row("Vaqt jadvali", "Хронология", event.event.label, locale),
      };
    case "advisory":
      return {
        id: `trace-advisory-${event.advisory.id}`,
        icon: "search",
        label: row("Ogohlantirish", "Предупреждение", event.advisory.title, locale),
      };
    case "route_proposed":
      return {
        id: `trace-route-${event.issueId}`,
        icon: "globe",
        label: row(
          "Sud yo'nalishi",
          "Маршрут суда",
          event.route.applicationType,
          locale,
        ),
      };
    case "document_proposed":
      return {
        id: `trace-document-${event.document.id}`,
        icon: "file",
        label: row(
          "Hujjat tayyorlandi",
          "Документ подготовлен",
          event.document.title,
          locale,
        ),
      };
    case "next_action":
      return {
        id: `trace-next-${event.action.action}`,
        icon: "arrow-right",
        label: row("Keyingi qadam", "Следующий шаг", event.action.label, locale),
      };
    default:
      // assistant_delta | question | active_issue | done → not trace rows.
      return null;
  }
}
