"use client";

import { Icon } from "@areeza/ui/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { cn } from "@areeza/ui/lib/utils";
import type { CaseFact } from "@areeza/core/types";

export function FactsPanel({ facts }: { facts: CaseFact[] }) {
  if (facts.length === 0) {
    return (
      <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-2)]">
        <CardHeader>
          <CardTitle className="text-base">Yig&apos;ilgan faktlar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">
            Suhbat davomida faktlar shu yerda paydo bo&apos;ladi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-2)]">
      <CardHeader>
        <CardTitle className="text-base">Yig&apos;ilgan faktlar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {facts.map((fact) => (
          <div
            key={fact.key}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              fact.status === "missing"
                ? "border-[var(--warn)]/40 bg-[var(--warn-bg)]"
                : "border-[var(--border)] bg-[var(--surface-2)]",
            )}
          >
            <div className="flex items-start gap-2">
              {fact.status === "missing" ? (
                <Icon
                  name="alertTriangle"
                  size="sm"
                  className="mt-0.5 text-[var(--warn)]"
                />
              ) : (
                <Icon name="check" size="sm" className="mt-0.5 text-[var(--success)]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">
                  {fact.label}
                </p>
                <p className="text-[var(--foreground)]">
                  {fact.value || "— ko'rsatilmagan"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
