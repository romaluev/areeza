"use client";

import { Icon } from "@areeza/ui/icons";
import { Badge } from "@areeza/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { cn } from "@areeza/ui/lib/utils";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepSources,
  ThinkingStepSource,
  type BadgeColor,
} from "@areeza/ui/components/fluid/thinking-steps";
import type { ValidationCheck, ValidationResult } from "@areeza/core/types";

const STATUS_BADGE: Record<ValidationCheck["status"], BadgeColor> = {
  ok: "green",
  warn: "amber",
  fail: "red",
};

export function ValidationPanel({ result }: { result: ValidationResult }) {
  const okCount = result.checks.filter((c) => c.status === "ok").length;
  const warnCount = result.checks.filter((c) => c.status === "warn").length;
  const failCount = result.checks.filter((c) => c.status === "fail").length;
  const lastIndex = result.checks.length - 1;

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
        <ThinkingSteps defaultOpen className="w-full">
          <ThinkingStepsHeader>Tekshiruv jarayoni</ThinkingStepsHeader>
          <ThinkingStepsContent>
            {result.checks.map((check, i) => (
              <ThinkingStep
                key={check.id}
                index={i}
                icon={check.status === "ok" ? "check" : "dot"}
                label={check.label}
                description={check.fix ?? undefined}
                status="complete"
                isLast={i === lastIndex}
                delay={i * 0.05}
              >
                <ThinkingStepSources>
                  <ThinkingStepSource color={STATUS_BADGE[check.status]} delay={i * 0.05}>
                    {check.ground}
                  </ThinkingStepSource>
                </ThinkingStepSources>
              </ThinkingStep>
            ))}
          </ThinkingStepsContent>
        </ThinkingSteps>
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
