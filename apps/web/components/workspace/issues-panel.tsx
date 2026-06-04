"use client";

import { StatusPill } from "@areeza/ui/components/status-pill";
import { cn } from "@areeza/ui/lib/utils";
import type { Issue, Situation } from "@areeza/core/types";
import { StepProgress } from "./step-progress";

const forumLabel: Record<string, string> = {
  civil_court: "Fuqarolik sudi",
  prosecutor: "Prokuratura",
  anticorruption_agency: "Korrupsiya agentligi",
  labor_inspectorate: "Mehnat inspeksiyasi",
  admin_authority: "Ma'muriy organ",
  family_court: "Oila sudi",
};

export function IssuesPanel({
  situation,
  activeIssueId,
  onSelectIssue,
}: {
  situation: Situation;
  activeIssueId?: string;
  onSelectIssue: (id: string) => void;
}) {
  return (
    <div className="space-y-3 overflow-y-auto p-4">
      {situation.issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          situation={situation}
          selected={activeIssueId === issue.id}
          onSelect={() => onSelectIssue(issue.id)}
        />
      ))}
    </div>
  );
}

function IssueCard({
  issue,
  situation,
  selected,
  onSelect,
}: {
  issue: Issue;
  situation: Situation;
  selected: boolean;
  onSelect: () => void;
}) {
  const doc = situation.documents.find((d) => d.issueIds.includes(issue.id));
  const forum = doc?.destination;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-surface-2",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink">{issue.title}</p>
          <p className="mt-1 text-xs text-muted">{issue.rationale}</p>
        </div>
        <StatusPill tone={issue.severity === "critical" ? "danger" : "default"}>
          {issue.severity === "critical" ? "Muhim" : issue.status}
        </StatusPill>
      </div>
      {forum ? (
        <p className="mt-2 text-xs text-muted">{forumLabel[forum] ?? forum}</p>
      ) : null}
      <div className="mt-3">
        <StepProgress current={issue.step} />
      </div>
    </button>
  );
}
