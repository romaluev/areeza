"use client";

import type { ReactNode } from "react";
import { Icon } from "@areeza/ui/icons";
import { motion } from "framer-motion";
import { Badge } from "@areeza/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { Separator } from "@areeza/ui/components/separator";
import { springTransition } from "@areeza/ui/motion/presets";
import type { Classification, LegalRoute } from "@areeza/core/types";

function FactBlock({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
        <span className="text-[var(--primary)]">{icon}</span>
        {label}
      </div>
      <p className="text-sm leading-snug text-[var(--foreground)]">{children}</p>
    </div>
  );
}

export function RouteCard({
  route,
  classification,
}: {
  route: LegalRoute;
  classification?: Classification;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={springTransition}
    >
      <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-2)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon name="route" size="sm" className="text-[var(--primary)]" />
            Protsessual marshrut
          </CardTitle>
          {classification ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary">{classification.label}</Badge>
              <Badge variant="outline">{classification.trackLabel}</Badge>
              <span className="text-xs text-[var(--muted-foreground)]">
                {Math.round(classification.confidence * 100)}% ishonch
              </span>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FactBlock icon={<Icon name="building" size="sm" />} label="Sud">
              {route.court}
            </FactBlock>
            <FactBlock icon={<Icon name="file" size="sm" />} label="Ariza turi">
              {route.applicationType}
            </FactBlock>
            <FactBlock icon={<Icon name="banknote" size="sm" />} label="Davlat boji">
              {route.feeNote}
            </FactBlock>
            <FactBlock icon={<Icon name="calendar" size="sm" />} label="Muddat">
              {route.limitation}
            </FactBlock>
          </div>
          <Separator />
          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">
              Yuridik asos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {route.legalBasis.map((b) => (
                <Badge key={b} variant="outline" className="font-normal">
                  {b}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">
              Talab qilinadigan hujjatlar
            </p>
            <ul className="space-y-1">
              {route.requiredDocuments.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--primary)]/50" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
