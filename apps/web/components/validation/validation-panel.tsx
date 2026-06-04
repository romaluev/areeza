"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@areeza/ui/icons";
import { Badge } from "@areeza/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { cn } from "@areeza/ui/lib/utils";
import { springTransition } from "@areeza/ui/motion/presets";
import type { ValidationCheck, ValidationResult } from "@areeza/core/types";

function StatusIcon({ status }: { status: ValidationCheck["status"] }) {
  if (status === "ok") return <Icon name="check" size="sm" className="text-success" />;
  if (status === "warn") return <Icon name="alertWarn" size="sm" className="text-warn" />;
  return <Icon name="cancel" size="sm" className="text-danger" />;
}

export function ValidationPanel({ result }: { result: ValidationResult }) {
  const reduced = useReducedMotion();
  const okCount = result.checks.filter((c) => c.status === "ok").length;
  const warnCount = result.checks.filter((c) => c.status === "warn").length;
  const failCount = result.checks.filter((c) => c.status === "fail").length;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon name="shield" size="sm" className="text-primary" />
          Tekshiruv ro&apos;yxati
        </CardTitle>
        <div className="flex gap-1.5">
          <Badge variant="success">{okCount} ✓</Badge>
          {warnCount > 0 ? <Badge variant="warn">{warnCount} !</Badge> : null}
          {failCount > 0 ? <Badge variant="danger">{failCount} ✗</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          FPK 189–195-moddalaridagi qaytarish asoslari bo&apos;yicha tekshirildi.
        </p>
        <ul className="space-y-1.5">
          {result.checks.map((check, i) => (
            <motion.li
              key={check.id}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springTransition, delay: reduced ? 0 : i * 0.06 }}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-2.5",
                check.status === "ok"
                  ? "border-border bg-muted/50"
                  : check.status === "warn"
                    ? "border-warn/30 bg-warn/10"
                    : "border-destructive/30 bg-destructive/5",
              )}
            >
              <StatusIcon status={check.status} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="text-sm">{check.label}</span>
                  <code className="shrink-0 text-[10px] text-muted-foreground">
                    {check.ground}
                  </code>
                </div>
                {check.fix ? (
                  <p className="mt-0.5 text-xs text-warn">→ {check.fix}</p>
                ) : null}
              </div>
            </motion.li>
          ))}
        </ul>
        <div
          className={cn(
            "rounded-lg p-3 text-sm font-medium",
            result.canFile ? "bg-success/10 text-success" : "bg-warn/10 text-warn",
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
