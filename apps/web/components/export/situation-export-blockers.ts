import type { Advisory, Situation, SituationDocument } from "@areeza/core/types";

export type ExportBlocker = {
  id: string;
  kind: "document" | "advisory";
  title: string;
  detail: string;
  actionLabel?: string;
};

const FORUM_LABELS: Record<string, string> = {
  civil_court: "Fuqarolik sudi",
  prosecutor: "Prokuratura",
  anticorruption_agency: "Korrupsiya agentligi",
  labor_inspectorate: "Mehnat inspeksiyasi",
  admin_authority: "Ma'muriy organ",
  family_court: "Oila sudi",
};

function forumLabel(destination: string): string {
  return FORUM_LABELS[destination] ?? destination;
}

function documentBlocker(doc: SituationDocument): ExportBlocker | null {
  const ready = doc.validation?.canFile === true || doc.status === "final";
  if (ready) return null;
  const failCount = doc.validation?.checks.filter((c) => c.status === "fail").length ?? 0;
  const warnCount = doc.validation?.checks.filter((c) => c.status === "warn").length ?? 0;
  const detail =
    failCount + warnCount > 0
      ? `${failCount} ta xato, ${warnCount} ta ogohlantirish — Tekshirish bosqichida tuzating.`
      : "Hujjat hali topshirishga tayyor emas.";
  return {
    id: `doc-${doc.id}`,
    kind: "document",
    title: doc.title,
    detail: `${forumLabel(doc.destination)} · ${detail}`,
    actionLabel: "Tekshirishga o'tish",
  };
}

function advisoryBlocker(adv: Advisory): ExportBlocker {
  return {
    id: `adv-${adv.id}`,
    kind: "advisory",
    title: adv.title,
    detail: adv.body,
    actionLabel: adv.status === "open" ? "Tanishdim" : undefined,
  };
}

export function getSituationExportBlockers(situation: Situation): ExportBlocker[] {
  const blockers: ExportBlocker[] = [];

  for (const doc of situation.documents) {
    const b = documentBlocker(doc);
    if (b) blockers.push(b);
  }

  for (const id of situation.readiness.blockingAdvisoryIds) {
    const adv = situation.advisories.find((a) => a.id === id);
    if (adv) blockers.push(advisoryBlocker(adv));
  }

  return blockers;
}

export function getForumGuide(destination: string): string {
  const guides: Record<string, string> = {
    civil_court: "my.sud.uz / cabinet.sud.uz — fuqarolik sudi",
    prosecutor: "prokuratura.uz — jinoiy ariza",
    anticorruption_agency: "anticorruption.uz — korrupsiya",
    labor_inspectorate: "mehnat.uz — mehnat inspeksiyasi",
    family_court: "my.sud.uz — oila / aliment",
    admin_authority: "Tegishli organ yoki prokuratura",
  };
  return guides[destination] ?? destination;
}
