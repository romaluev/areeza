"use client";

import { ListRow, ListRowGroup } from "@areeza/ui/components/list-row";
import { StatusPill } from "@areeza/ui/components/status-pill";
import type { Issue, Situation } from "@areeza/core/types";
import { ReviewReadinessSummary, IssueDetailPane } from "./review-readiness";

const FORUM_LABELS: Record<string, string> = {
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
  const resolvedId = activeIssueId ?? situation.issues[0]?.id;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 flex-col border-b border-border lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r">
        <ReviewReadinessSummary situation={situation} />
        <ListRowGroup className="min-h-0 flex-1 overflow-y-auto p-2">
          {situation.issues.map((issue) => (
            <IssueListRow
              key={issue.id}
              issue={issue}
              situation={situation}
              selected={resolvedId === issue.id}
              onSelect={() => onSelectIssue(issue.id)}
            />
          ))}
        </ListRowGroup>
      </div>
      <IssueDetailPane situation={situation} issueId={resolvedId ?? ""} />
    </div>
  );
}

function IssueListRow({
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
  const docReady = doc?.validation?.canFile === true || doc?.status === "final";

  return (
    <ListRow
      title={issue.title}
      subtitle={forum ? (FORUM_LABELS[forum] ?? forum) : issue.rationale}
      selected={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      trailing={
        <StatusPill tone={issue.severity === "critical" ? "danger" : docReady ? "success" : "warn"}>
          {issue.severity === "critical" ? "Muhim" : docReady ? "Tayyor" : "Tekshirish"}
        </StatusPill>
      }
    />
  );
}
