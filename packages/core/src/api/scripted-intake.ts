import type { IntakeEvent, Situation } from "../types/index";
import {
  getSituationDetail,
  resolveSituationIdFromPrompt,
  SCENARIO_A,
  SCENARIO_B,
  SCENARIO_C,
} from "./situation-fixtures";

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("Aborted"));
    });
  });

function eventsFromSituation(s: Situation, situationId: string): Array<{ afterMs: number; event: IntakeEvent }> {
  const script: Array<{ afterMs: number; event: IntakeEvent }> = [
    { afterMs: 300, event: { type: "assistant_delta", delta: "Holatingizni tahlil qilmoqdaman… " } },
  ];
  let t = 600;
  for (const issue of s.issues) {
    script.push({
      afterMs: t,
      event: { type: "issue_identified", issue },
    });
    t += 400;
  }
  for (const party of s.parties.slice(0, 3)) {
    script.push({ afterMs: t, event: { type: "party_added", party } });
    t += 300;
  }
  for (const ev of s.evidence.slice(0, 2)) {
    script.push({ afterMs: t, event: { type: "evidence_logged", evidence: ev } });
    t += 300;
  }
  for (const tl of s.timeline.slice(0, 3)) {
    script.push({ afterMs: t, event: { type: "timeline_event", event: tl } });
    t += 300;
  }
  for (const adv of s.advisories.filter((a) => a.severity === "urgent" || a.severity === "high").slice(0, 2)) {
    script.push({ afterMs: t, event: { type: "advisory", advisory: adv } });
    t += 300;
  }
  for (const doc of s.documents) {
    script.push({ afterMs: t, event: { type: "document_proposed", document: doc } });
    t += 500;
  }
  if (s.activeIssueId) {
    script.push({ afterMs: t, event: { type: "active_issue", issueId: s.activeIssueId } });
    t += 200;
  }
  script.push({
    afterMs: t + 400,
    event: {
      type: "next_action",
      action: { label: "Ishlar panelini ko'rish", action: "open_issues" },
    },
  });
  script.push({
    afterMs: t + 800,
    event: { type: "done", situationId, caseId: situationId },
  });
  return script;
}

export async function* streamScriptedIntake(
  initialText: string,
  signal?: AbortSignal,
): AsyncGenerator<IntakeEvent> {
  const situationId = resolveSituationIdFromPrompt(initialText);
  const preset =
    situationId === SCENARIO_A.id
      ? SCENARIO_A
      : situationId === SCENARIO_B.id
        ? SCENARIO_B
        : situationId === SCENARIO_C.id
          ? SCENARIO_C
          : getSituationDetail(situationId);

  const script = preset
    ? eventsFromSituation(preset, situationId)
    : ([
        {
          afterMs: 500,
          event: {
            type: "assistant_delta" as const,
            delta: "Muammoingizni qisqacha tasvirlang — keyin yo'nalishlarni aniqlaymiz.",
          },
        },
        {
          afterMs: 1200,
          event: {
            type: "question" as const,
            question: "Asosiy talabingiz nima?",
            options: ["Pul undirish", "Ishga qaytarish", "Jinoiy tekshiruv", "Boshqa"],
          },
        },
        {
          afterMs: 2000,
          event: { type: "done" as const, situationId: "situation-intake-new" },
        },
      ] satisfies Array<{ afterMs: number; event: IntakeEvent }>);

  let last = 0;
  for (const step of script) {
    await delay(step.afterMs - last, signal);
    last = step.afterMs;
    yield step.event;
  }
}
