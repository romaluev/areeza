"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@areeza/ui/components/button";
import { EmptyState } from "@areeza/ui/components/empty-state";
import { ListRow, ListRowGroup } from "@areeza/ui/components/list-row";
import { StatusPill } from "@areeza/ui/components/status-pill";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { api, isMockFailureError } from "@areeza/core/api";
import { situationStatusLabel, uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import { showRetryToast } from "@/lib/retry-toast";
import { useTopBar } from "@/components/shell/use-top-bar";

function formatUpdated(iso: string, locale: "uz" | "ru"): string {
  try {
    return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "uz-UZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function SituationsListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
      ))}
    </div>
  );
}

export function SituationsHome() {
  const { locale } = useAppLocale();
  const copy = uiCopy(locale);
  const topBarConfig = useMemo(() => ({ title: copy.situationsHomeTitle }), [copy.situationsHomeTitle]);
  useTopBar(topBarConfig);

  const {
    data: situations,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["situations"],
    queryFn: () => api.listSituations(),
  });

  const refetchList = useCallback(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!isError || !error) return;
    if (isMockFailureError(error)) {
      showRetryToast(copy.listLoadErrorTitle, refetchList);
    }
  }, [isError, error, copy.listLoadErrorTitle, refetchList]);

  const items = situations ?? [];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{copy.situationsHomeTitle}</h1>
          <p className="text-sm text-muted-foreground">{copy.situationsHomeSubtitle}</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/situations/new">{copy.newSituation}</Link>
        </Button>
      </div>

      {isLoading ? (
        <SituationsListSkeleton />
      ) : isError ? (
        <EmptyState
          icon="alert"
          title={copy.listLoadErrorTitle}
          description={copy.listLoadErrorDescription}
          action={
            <Button variant="outline" onClick={refetchList}>
              {copy.retry}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="folder"
          title={copy.emptySituationsTitle}
          description={copy.emptySituationsDescription}
          action={
            <Button asChild variant="brand">
              <Link href="/situations/new">{copy.startFirstSituation}</Link>
            </Button>
          }
        />
      ) : (
        <ListRowGroup className="divide-y divide-border rounded-xl border border-border bg-card">
          {items.map((s) => {
            const updated = formatUpdated(s.updatedAt, locale);
            const ariaLabel = `${copy.openSituation(s.title)}. ${copy.documentsReady(
              s.readiness.documentsReady,
              s.readiness.documentsTotal,
            )}. ${copy.updatedAt(updated)}`;
            return (
              <Link
                key={s.id}
                href={`/situations/${s.id}`}
                className="block"
                aria-label={ariaLabel}
              >
                <ListRow
                  title={s.title}
                  subtitle={`${copy.documentsReady(
                    s.readiness.documentsReady,
                    s.readiness.documentsTotal,
                  )} · ${copy.updatedAt(updated)}`}
                  trailing={
                    <StatusPill tone={s.status === "ready" ? "success" : "primary"}>
                      {situationStatusLabel(s.status, locale)}
                    </StatusPill>
                  }
                />
              </Link>
            );
          })}
        </ListRowGroup>
      )}
    </div>
  );
}
