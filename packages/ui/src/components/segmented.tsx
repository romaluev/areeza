"use client";

import * as React from "react";
import { LayoutGroup, motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useProximityHover } from "../hooks/use-proximity-hover";
import { useMotionTransition, useReducedMotion } from "../hooks/use-reduced-motion";
import { interactiveWeight } from "../lib/font-weight";
import { reducedMotionClass } from "../motion/presets";

const focusRing =
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string = string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  layoutId?: string;
  "aria-label"?: string;
}

export function Segmented<T extends string = string>({
  value,
  onValueChange,
  options,
  className,
  layoutId = "areeza-segmented-pill",
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  useProximityHover(listRef, { axis: "x" });
  const transition = useMotionTransition("moderate");
  const reducedMotion = useReducedMotion();

  return (
    <LayoutGroup id={layoutId}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        data-slot="segmented"
        className={cn(
          "relative inline-flex h-8 items-center gap-0.5 rounded-lg bg-surface-3 p-[length:var(--control-track-padding)]",
          reducedMotionClass,
          className,
        )}
      >
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-proximity-id={opt.value}
              disabled={opt.disabled}
              onClick={() => onValueChange(opt.value)}
              className={cn(
                "relative z-10 inline-flex h-[calc(var(--control-h)-var(--control-track-padding)*2)] flex-1 items-center justify-center whitespace-nowrap rounded-pill px-3 text-sm",
                interactiveWeight,
                "text-muted-foreground transition-[color] duration-[var(--dur-fast)]",
                focusRing,
                "disabled:pointer-events-none disabled:opacity-50",
                isActive && "text-foreground",
                "data-[proximity]:text-foreground",
              )}
            >
              {isActive && !reducedMotion ? (
                <motion.span
                  layoutId={layoutId}
                  transition={transition}
                  className="absolute inset-0 rounded-pill bg-card shadow-surface-2"
                  aria-hidden
                />
              ) : isActive ? (
                <span
                  className="absolute inset-0 rounded-pill bg-card shadow-surface-2"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
