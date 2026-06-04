"use client";

import type { PipelineStep } from "@areeza/core/types";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@areeza/ui/icons";
import { springs } from "@areeza/ui/motion/springs";
import { cn } from "@areeza/ui/lib/utils";
import { PIPELINE_STEPS } from "@/lib/copy";

const STEP_PILL_LAYOUT_ID = "areeza-step-pill";

type StepDef = { id: string; label: string };

function StepIndicatorList({
  steps,
  currentIndex,
  layoutGroupId,
  onStepClick,
  className,
}: {
  steps: readonly StepDef[];
  currentIndex: number;
  layoutGroupId: string;
  onStepClick?: (index: number) => void;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <LayoutGroup id={layoutGroupId}>
      <ol
        className={cn("relative flex flex-wrap items-center gap-1 text-xs", className)}
        aria-label="Ish jarayoni"
      >
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const clickable = done && !!onStepClick;

          return (
            <li key={step.id} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!clickable && !active}
                aria-current={active ? "step" : undefined}
                onClick={() => {
                  if (clickable) onStepClick?.(i);
                }}
                className={cn(
                  "relative rounded-full px-2 py-1 font-medium outline-none transition-colors",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  clickable && "cursor-pointer hover:bg-accent/50",
                  !clickable && !active && "cursor-default",
                  !done && !active && "text-muted-foreground",
                  done && !active && "text-success",
                  active && "text-primary-foreground",
                )}
              >
                {active ? (
                  reduced ? (
                    <span
                      className="absolute inset-0 rounded-full bg-primary shadow-sm"
                      aria-hidden
                    />
                  ) : (
                    <motion.span
                      layoutId={STEP_PILL_LAYOUT_ID}
                      className="absolute inset-0 rounded-full bg-primary shadow-sm"
                      transition={springs.snappy}
                      aria-hidden
                    />
                  )
                ) : null}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                      active && "bg-primary-foreground/20",
                      done && !active && "bg-success/15 text-success",
                      !done && !active && "bg-muted text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {done ? <Icon name="check" size={12} /> : i + 1}
                  </span>
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 ? (
                <Icon name="arrowRight" size={12} className="text-muted-foreground" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </LayoutGroup>
  );
}

export function WorkspaceStepProgress({
  steps,
  currentIndex,
  onStepClick,
}: {
  steps: ReadonlyArray<StepDef>;
  currentIndex: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <StepIndicatorList
      steps={steps}
      currentIndex={currentIndex}
      layoutGroupId="workspace-step-progress"
      onStepClick={onStepClick}
    />
  );
}

export function StepProgress({ current }: { current: PipelineStep }) {
  const idx = PIPELINE_STEPS.findIndex((s) => s.id === current);
  const safeIdx = idx < 0 ? 0 : idx;

  return (
    <StepIndicatorList
      steps={PIPELINE_STEPS}
      currentIndex={safeIdx}
      layoutGroupId="pipeline-step-progress"
      className="rounded-lg bg-muted p-1"
    />
  );
}
