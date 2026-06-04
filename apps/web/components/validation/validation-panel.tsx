"use client";

import { motion } from "framer-motion";
import { Icon } from "@areeza/ui/icons";
import { Badge } from "@areeza/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { cn } from "@areeza/ui/lib/utils";
import { springTransition } from "@areeza/ui/motion/presets";
import type { ValidationCheck, ValidationResult } from "@areeza/core/types";

function StatusIcon({ status }: { status: ValidationCheck["status"] }) {
  if (status === "ok")
    return <Icon name="check" size="sm" className="text-[var(--success)]" />;
  if (status === "warn")
    return <Icon name="alertWarn" size="sm" className="text-[var(--warn)]" />;
  return <Icon name="cancel" size="sm" className="text-[var(--danger)]" />;
}

export function ValidationPanel({ result }: { result: ValidationResult }) {
  const okCount = result.checks.filter((c) => c.status === "ok").length;
  const warnCount = result.checks.filter((c) => c.status === "warn").length;
  const failCount = result.checks.filter((c) => c.status === "fail").length;

  return (
    <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-2)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon name="shield" size="sm" className="text-[var(--primary)]" />
          Tekshiruv ro&apos;yxati
        </CardTitle>
        <div className="flex gap-1.5">
          <Badge variant="success">{okCount} ✓</Badge>
          {warnCount > 0 && <Badge variant="warn">{warnCount} !</Badge>}
          {failCount > 0 && <Badge variant="danger">{failCount} ✗</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-[var(--muted-foreground)]">
          FPK 189–195-moddalaridagi qaytarish asoslari bo&apos;yicha tekshirildi.
        </p>
        <ul className="space-y-1.5">
          {result.checks.map((check, i) => (
            <motion.li
              key={check.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springTransition, delay: i * 0.06 }}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-2.5",
                check.status === "ok"
                  ? "border-[var(--border)] bg-[var(--surface-2)]"
                  : check.status === "warn"
                    ? "border-[var(--warn)]/30 bg-[var(--warn-bg)]/50"
                    : "border-[var(--danger)]/30 bg-[var(--danger-bg)]/50",
              )}
            >
              <StatusIcon status={check.status} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="text-sm">{check.label}</span>
                  <code className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                    {check.ground}
                  </code>
                </div>
                {check.fix ? (
                  <p className="mt-0.5 text-xs text-[var(--warn)]">→ {check.fix}</p>
                ) : null}
              </div>
            </motion.li>
          ))}
        </ul>
        <div
          className={cn(
            "rounded-lg p-3 text-sm font-medium",
            result.canFile
              ? "bg-[var(--success-bg)] text-[var(--success)]"
              : "bg-[var(--warn-bg)] text-[var(--warn)]",
          )}
        >
          {result.canFile
            ? "Hujjat topshirishga tayyor."
            : `${warnCount + failCount} ta nuqtani to'g'rilang — keyin topshirish xavfsiz.`}
        </div>
      </CardContent>
    </Card>
  );
}
