"use client";

import { Icon } from "@areeza/ui/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { TimelineItem, TimelineList } from "@areeza/ui/components/timeline-item";
import type { PipelineStep, StatusEvent } from "@areeza/core/types";
import { PIPELINE_STEPS } from "@/lib/copy";

function formatAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function stepIndex(step: PipelineStep): number {
  return PIPELINE_STEPS.findIndex((s) => s.id === step);
}

export function TrackingPanel({
  events,
  currentStep,
}: {
  events: StatusEvent[];
  currentStep: PipelineStep;
}) {
  const currentIdx = stepIndex(currentStep);
  const sorted = [...events].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-2)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon name="list" size="sm" className="text-[var(--primary)]" />
            Jarayon kuzatuvi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">
            Murojaat va keyingi bosqichlar shu yerda paydo bo&apos;ladi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-2)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon name="list" size="sm" className="text-[var(--primary)]" />
          Jarayon kuzatuvi
        </CardTitle>
        <p className="text-xs text-[var(--muted-foreground)]">
          Ish holati va keyingi qadamlar — sud topshirishgacha.
        </p>
      </CardHeader>
      <CardContent>
        <TimelineList>
          {sorted.map((ev, i) => {
            const idx = stepIndex(ev.step);
            const completed = idx >= 0 && (currentIdx < 0 || idx < currentIdx);
            const active = idx >= 0 && idx === currentIdx;
            return (
              <TimelineItem
                key={`${ev.step}-${ev.at}`}
                label={ev.label}
                at={formatAt(ev.at)}
                note={ev.note}
                completed={completed}
                active={active}
                isLast={i === sorted.length - 1}
              />
            );
          })}
        </TimelineList>
      </CardContent>
    </Card>
  );
}
