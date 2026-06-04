"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@areeza/core/api";
import { CATEGORIES, getCategoryLabel } from "@areeza/core/legal";
import type { Case, CaseStatus, CategoryCode } from "@areeza/core/types";
import { Icon } from "@areeza/ui/icons";
import { Button } from "@areeza/ui/components/button";
import { Input } from "@areeza/ui/components/input";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { CaseCard } from "@areeza/ui/components/case-card";
import { ListRow, ListRowGroup } from "@areeza/ui/components/list-row";
import { MetricCard } from "@areeza/ui/components/metric-card";
import { Segmented } from "@areeza/ui/components/segmented";
import { EmptyState } from "@areeza/ui/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@areeza/ui/components/select";
import { STATUS_LABELS } from "@/lib/copy";
import { isMockFailureError } from "@areeza/core/api";
import { showRetryToast } from "@/lib/retry-toast";

type ViewMode = "list" | "grid" | "grouped";
type SortKey = "updated-desc" | "updated-asc" | "title-asc" | "title-desc";

const STATUS_ORDER: CaseStatus[] = [
  "intake",
  "classified",
  "routed",
  "draft",
  "drafted",
  "validated",
  "ready",
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated-desc", label: "Yangilangan (eng so'nggi)" },
  { value: "updated-asc", label: "Yangilangan (eng eski)" },
  { value: "title-asc", label: "Nomi (A → Z)" },
  { value: "title-desc", label: "Nomi (Z → A)" },
];

function sortCases(cases: Case[], sort: SortKey): Case[] {
  const copy = [...cases];
  switch (sort) {
    case "updated-asc":
      return copy.sort(
        (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
    case "title-asc":
      return copy.sort((a, b) => a.title.localeCompare(b.title, "uz"));
    case "title-desc":
      return copy.sort((a, b) => b.title.localeCompare(a.title, "uz"));
    default:
      return copy.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }
}

function formatUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function caseSubtitle(c: Case): string {
  const parts: string[] = [formatUpdated(c.updatedAt)];
  if (c.categoryCode) {
    parts.push(getCategoryLabel(c.categoryCode as CategoryCode));
  }
  if (c.claimAmount) parts.push(c.claimAmount);
  return parts.join(" · ");
}

function SummaryStripSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
      ))}
    </div>
  );
}

function CasesListSkeleton({ mode }: { mode: ViewMode }) {
  if (mode === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

function CaseListRows({ cases }: { cases: Case[] }) {
  return (
    <ListRowGroup className="gap-0.5">
      {cases.map((c) => (
        <Link key={c.id} href={`/cases/${c.id}`} className="block">
          <ListRow
            rowId={c.id}
            title={c.title}
            subtitle={caseSubtitle(c)}
            status={c.status}
            statusLabel={STATUS_LABELS[c.status] ?? c.status}
          />
        </Link>
      ))}
    </ListRowGroup>
  );
}

function CaseGrid({ cases }: { cases: Case[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cases.map((c) => (
        <Link key={c.id} href={`/cases/${c.id}`} className="block">
          <CaseCard
            title={c.title}
            status={c.status}
            statusLabel={STATUS_LABELS[c.status] ?? c.status}
            categoryLabel={
              c.categoryCode
                ? getCategoryLabel(c.categoryCode as CategoryCode)
                : undefined
            }
            meta={
              c.claimAmount ? (
                <span>Da&apos;vo bahosi: {c.claimAmount}</span>
              ) : (
                <span>{formatUpdated(c.updatedAt)}</span>
              )
            }
          />
        </Link>
      ))}
    </div>
  );
}

function CaseGrouped({ cases }: { cases: Case[] }) {
  const byStatus = useMemo(() => {
    const map = new Map<CaseStatus, Case[]>();
    for (const status of STATUS_ORDER) map.set(status, []);
    for (const c of cases) {
      const bucket = map.get(c.status) ?? [];
      bucket.push(c);
      map.set(c.status, bucket);
    }
    return STATUS_ORDER.filter((s) => (map.get(s)?.length ?? 0) > 0).map((status) => ({
      status,
      items: map.get(status) ?? [],
    }));
  }, [cases]);

  return (
    <div className="flex flex-col gap-8">
      {byStatus.map(({ status, items }) => (
        <section key={status}>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
            {STATUS_LABELS[status] ?? status}
            <span className="ml-2 tabular-nums">({items.length})</span>
          </h2>
          <CaseListRows cases={items} />
        </section>
      ))}
    </div>
  );
}

export function CasesHome() {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("updated-desc");

  const {
    data: counts,
    isLoading: countsLoading,
    isError: countsError,
    refetch: refetchCounts,
  } = useQuery({
    queryKey: ["case-summary"],
    queryFn: () => api.getCaseSummaryCounts(),
  });

  const {
    data: cases,
    isLoading: casesLoading,
    isError: casesError,
    refetch: refetchCases,
  } = useQuery({
    queryKey: ["cases"],
    queryFn: () => api.listCases(),
  });

  const filtered = useMemo(() => {
    if (!cases) return [];
    const q = search.trim().toLowerCase();
    let list = cases.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (categoryFilter !== "all" && c.categoryCode !== categoryFilter) return false;
      return true;
    });
    return sortCases(list, sort);
  }, [cases, search, statusFilter, categoryFilter, sort]);

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== "all" || categoryFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const isLoading = casesLoading || countsLoading;
  const isError = casesError || countsError;

  const refetchAll = () => {
    void refetchCases();
    void refetchCounts();
  };

  useEffect(() => {
    if (!isError) return;
    if (casesError && isMockFailureError(casesError)) {
      showRetryToast("Ro'yxat yuklanmadi", refetchAll);
    }
    if (countsError && isMockFailureError(countsError)) {
      showRetryToast("Statistika yuklanmadi", () => void refetchCounts());
    }
  }, [isError, casesError, countsError, refetchAll, refetchCounts]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Ishlarim
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Tayyorlangan murojaatlar va ularning holati
            </p>
          </div>
          <Link href="/cases/new" className="shrink-0">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              <Icon name="add" size="sm" />
              Yangi ish
            </Button>
          </Link>
        </div>

        <div className="mt-6">
          {countsLoading ? (
            <SummaryStripSkeleton />
          ) : countsError ? (
            <p className="text-sm text-[var(--danger)]">
              Statistika yuklanmadi.{" "}
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => void refetchCounts()}
              >
                Qayta urinish
              </button>
            </p>
          ) : counts ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard
                label="Jami"
                value={counts.total}
                icon={<Icon name="folder" size="md" />}
              />
              <MetricCard label="Murojaat" value={counts.intake} />
              <MetricCard label="Jarayonda" value={counts.inProgress} />
              <MetricCard label="Hujjat bosqichi" value={counts.draft} />
              <MetricCard
                label="Topshirishga tayyor"
                value={counts.ready}
                icon={<Icon name="check" size="md" />}
              />
            </div>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={view}
            onValueChange={setView}
            layoutId="cases-view-mode"
            aria-label="Ko'rinish"
            options={[
              { value: "list", label: "Ro'yxat" },
              { value: "grid", label: "Karta" },
              { value: "grouped", label: "Guruh" },
            ]}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Input
                type="search"
                placeholder="Qidirish…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Ish nomi bo'yicha qidirish"
                className="pr-9"
              />
              <Icon
                name="list"
                size="sm"
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 opacity-40"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" aria-label="Holat bo'yicha filtr">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[220px]" aria-label="Tur bo'yicha filtr">
                <SelectValue placeholder="Tur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turlar</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.code} value={cat.code}>
                    {cat.labelUz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[220px]" aria-label="Saralash">
                <SelectValue placeholder="Saralash" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <CasesListSkeleton mode={view} />
        ) : isError ? (
          <EmptyState
            icon="alert"
            title="Ro'yxat yuklanmadi"
            description="Internet yoki server bilan bog'liq muammo bo'lishi mumkin."
            action={
              <Button variant="outline" onClick={refetchAll}>
                Qayta urinish
              </Button>
            }
          />
        ) : cases?.length === 0 ? (
          <EmptyState
            icon="folder"
            title="Hali ishlar yo'q"
            description="Birinchi murojaatingizni boshlang — Areeza to'g'ri yo'nalish va hujjat tayyorlashda yordam beradi."
            action={
              <Link href="/cases/new">
                <Button>Birinchi murojaatni boshlash</Button>
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="folder"
            title="Mos ish topilmadi"
            description="Qidiruv yoki filtrlarni o'zgartiring."
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Filtrlarni tozalash
                </Button>
              ) : (
                <Link href="/cases/new">
                  <Button>Yangi ish</Button>
                </Link>
              )
            }
          />
        ) : view === "grid" ? (
          <CaseGrid cases={filtered} />
        ) : view === "grouped" ? (
          <CaseGrouped cases={filtered} />
        ) : (
          <CaseListRows cases={filtered} />
        )}
      </div>
    </div>
  );
}
