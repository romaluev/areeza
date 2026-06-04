"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@areeza/ui/icons";
import { api } from "@areeza/core/api";
import { getCategoryLabel } from "@areeza/core/legal";
import { Button } from "@areeza/ui/components/button";
import { Badge } from "@areeza/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { STATUS_LABELS } from "@/lib/copy";
import type { CategoryCode } from "@areeza/core/types";

export default function CasesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["cases"],
    queryFn: () => api.listCases(),
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ishlar ro&apos;yxati</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Barcha murojaatlar va ularning holati
          </p>
        </div>
        <Link href="/cases/new">
          <Button className="gap-2">
            <Icon name="add" size="sm" />
            Yangi ish
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-[var(--danger)]">Ro&apos;yxat yuklanmadi.</p>
            <Button variant="outline" className="mt-3" onClick={() => refetch()}>
              Qayta urinish
            </Button>
          </CardContent>
        </Card>
      )}

      {data?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--muted-foreground)]">Hali ishlar yo&apos;q.</p>
            <Link href="/cases/new" className="mt-4 inline-block">
              <Button>Birinchi murojaatni boshlash</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {c.categoryCode ? (
                      <Badge variant="outline">
                        {getCategoryLabel(c.categoryCode as CategoryCode)}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary">{STATUS_LABELS[c.status] ?? c.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {c.claimAmount ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Da&apos;vo bahosi: {c.claimAmount}
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--muted-foreground)]">Davom etmoqda…</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
