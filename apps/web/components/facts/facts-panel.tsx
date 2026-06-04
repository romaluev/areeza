"use client";

import { Icon } from "@areeza/ui/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { cn } from "@areeza/ui/lib/utils";
import type { CaseFact } from "@areeza/core/types";

export function FactsPanel({ facts }: { facts: CaseFact[] }) {
  if (facts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yig&apos;ilgan faktlar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Suhbat davomida faktlar shu yerda paydo bo&apos;ladi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
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
                ? "border-warn/40 bg-warn/10"
                : "border-border bg-muted/50",
            )}
          >
            <div className="flex items-start gap-2">
              {fact.status === "missing" ? (
                <Icon name="alertTriangle" size="sm" className="mt-0.5 text-warn" />
              ) : (
                <Icon name="check" size="sm" className="mt-0.5 text-success" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{fact.label}</p>
                <p className="text-foreground">{fact.value || "— ko'rsatilmagan"}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
