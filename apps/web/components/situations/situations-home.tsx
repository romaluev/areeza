"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@areeza/ui/components/button";
import { CaseCard } from "@areeza/ui/components/case-card";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { api } from "@areeza/core/api";

export function SituationsHome() {
  const { data: situations, isLoading } = useQuery({
    queryKey: ["situations"],
    queryFn: () => api.listSituations(),
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Mening holatlarim</h1>
          <p className="text-sm text-muted">Har bir holat — bir nechta masala va hujjat</p>
        </div>
        <Button asChild>
          <Link href="/situations/new">Yangi holat</Link>
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <ul className="space-y-3">
          {(situations ?? []).map((s) => (
            <li key={s.id}>
              <Link href={`/situations/${s.id}`}>
                <CaseCard
                  title={s.title}
                  meta={`${s.readiness.documentsReady}/${s.readiness.documentsTotal} hujjat`}
                  status={s.status === "ready" ? "ready" : s.status === "intake" ? "intake" : "classified"}
                  statusLabel={s.status}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
