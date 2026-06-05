"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Button } from "@areeza/ui/components/button";
import { EmptyState } from "@areeza/ui/components/empty-state";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { isMockFailureError } from "@areeza/core/api";
import type { PipelineStep } from "@areeza/core/types";
import { uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import { showRetryToast } from "@/lib/retry-toast";
import { useBoardIssues } from "@/lib/use-board-issues";
import { useMoveIssue } from "@/lib/use-move-issue";
import { useTopBar } from "@/components/shell/use-top-bar";
import { IssuesBoard } from "./issues-board";

function BoardSkeleton() {
  return (
    <div className="flex flex-1 gap-3 overflow-hidden p-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-full w-[272px] shrink-0 rounded-xl" />
      ))}
    </div>
  );
}

export function IssuesBoardPage() {
  const { locale } = useAppLocale();
  const copy = uiCopy(locale);
  const topBarConfig = useMemo(() => ({ title: copy.boardTitle }), [copy.boardTitle]);
  useTopBar(topBarConfig);
  const { issues, isLoading, isError, error, refetch } = useBoardIssues();
  const moveIssue = useMoveIssue();

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (isError && error && isMockFailureError(error)) {
      showRetryToast(copy.listLoadErrorTitle, retry);
    }
  }, [isError, error, copy.listLoadErrorTitle, retry]);

  const onMoveIssue = useMemo(
    () =>
      (issueId: string, situationId: string, step: PipelineStep, position: number) => {
        moveIssue.mutate({ issueId, situationId, step, position });
      },
    [moveIssue],
  );

  if (isLoading) return <BoardSkeleton />;

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon="alert"
          title={copy.listLoadErrorTitle}
          description={copy.listLoadErrorDescription}
          action={
            <Button variant="outline" onClick={retry}>
              {copy.retry}
            </Button>
          }
        />
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon="board"
          title={copy.emptySituationsTitle}
          description={copy.emptySituationsDescription}
        />
      </div>
    );
  }

  return <IssuesBoard issues={issues} locale={locale} onMoveIssue={onMoveIssue} />;
}
