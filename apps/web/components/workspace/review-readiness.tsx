"use client";

import { Progress } from "@areeza/ui/components/progress";
import { StatusPill } from "@areeza/ui/components/status-pill";
import { cn } from "@areeza/ui/lib/utils";
import type { Advisory, Situation } from "@areeza/core/types";
import { ValidationPanel } from "@/components/validation/validation-panel";
import { RouteCard } from "@/components/route/route-card";
import { documentsForIssue } from "@areeza/core/types";

const FORUM_LABELS: Record<string, string> = {
  civil_court: "Fuqarolik sudi",
  prosecutor: "Prokuratura",
  anticorruption_agency: "Korrupsiya agentligi",
  labor_inspectorate: "Mehnat inspeksiyasi",
  admin_authority: "Ma'muriy organ",
  family_court: "Oila sudi",
};

export function ReviewReadinessSummary({ situation }: { situation: Situation }) {
  const { documentsReady, documentsTotal, canExport, blockingAdvisoryIds } = situation.readiness;
  const pct =
    documentsTotal > 0 ? Math.round((documentsReady / documentsTotal) * 100) : 0;
  const blocking = situation.advisories.filter((a) =>
    blockingAdvisoryIds.includes(a.id),
  );

  return (
    <div className="space-y-4 border-b border-border p-4 lg:p-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Tayyorlik</h2>
          <StatusPill tone={canExport ? "success" : "warn"}>
            {canExport ? "Topshirish mumkin" : "To'ldirish kerak"}
          </StatusPill>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Hujjatlar {documentsReady}/{documentsTotal} tayyor
        </p>
        <Progress value={pct} className="mt-3 h-1.5" />
      </div>

      {blocking.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Bloklovchi ogohlantirishlar</p>
          <ul className="space-y-2">
            {blocking.map((a) => (
              <BlockingAdvisory key={a.id} advisory={a} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function BlockingAdvisory({ advisory }: { advisory: Advisory }) {
  return (
    <li
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        advisory.severity === "urgent"
          ? "border-destructive/30 bg-destructive/5"
          : "border-warn/30 bg-warn/5",
      )}
    >
      <p className="font-medium">{advisory.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{advisory.body}</p>
    </li>
  );
}

export function IssueDetailPane({
  situation,
  issueId,
}: {
  situation: Situation;
  issueId: string;
}) {
  const issue = situation.issues.find((i) => i.id === issueId);
  const docs = documentsForIssue(situation, issueId);
  const linkedAdvisories = situation.advisories.filter((a) => a.issueIds.includes(issueId));
  const doc = docs[0];

  if (!issue) {
    return (
      <p className="p-4 text-sm text-muted-foreground">Masala tanlanmagan.</p>
    );
  }

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 lg:p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{issue.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{issue.rationale}</p>
      </div>

      {doc ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Bog&apos;langan hujjat</p>
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <p className="font-medium">{doc.title}</p>
            <p className="text-xs text-muted-foreground">
              {FORUM_LABELS[doc.destination] ?? doc.destination}
            </p>
          </div>
          {doc.validation ? <ValidationPanel result={doc.validation} /> : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Bu masala uchun hujjat hali biriktirilmagan.</p>
      )}

      {issue.route ? (
        <RouteCard route={issue.route} />
      ) : null}

      {linkedAdvisories.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Maslahatlar</p>
          <ul className="space-y-2">
            {linkedAdvisories.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
              >
                <p className="font-medium">{a.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
