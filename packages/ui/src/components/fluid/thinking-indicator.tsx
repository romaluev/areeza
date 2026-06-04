"use client";

import {
  forwardRef,
  useState,
  useEffect,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@areeza/ui/lib/utils";

const circleA =
  "M 12 8 C 14.21 8 16 9.79 16 12 C 16 14.21 14.21 16 12 16 C 9.79 16 8 14.21 8 12 C 8 9.79 9.79 8 12 8 Z";

const infinity =
  "M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z";

const circleB =
  "M 12 16 C 14.21 16 16 14.21 16 12 C 16 9.79 14.21 8 12 8 C 9.79 8 8 9.79 8 12 C 8 14.21 9.79 16 12 16 Z";

/** Default word cycle from Fluid Functionalism reference registry. */
export const DEFAULT_THINKING_WORDS = [
  "Thinking",
  "Moonwalking",
  "Planning",
  "Refining",
] as const;

const DEFAULT_INTERVAL_MS = 4000;

export interface ThinkingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Cycling status words (shimmer + vertical slide). */
  words?: string[];
  /** Interval between word changes when `words.length > 1`. */
  intervalMs?: number;
}

/**
 * Pre-chunk wait state: morphing SVG + shimmer cycling text.
 * Ported from references/repos/fluid-functionalism/registry/default/thinking-indicator.tsx
 */
export const ThinkingIndicator = forwardRef<HTMLDivElement, ThinkingIndicatorProps>(
  (
    {
      className,
      words = [...DEFAULT_THINKING_WORDS],
      intervalMs = DEFAULT_INTERVAL_MS,
      ...props
    },
    ref,
  ) => {
    const reduceMotion = useReducedMotion();
    const [index, setIndex] = useState(0);
    const cycle = words.length > 1 && !reduceMotion;

    useEffect(() => {
      if (!cycle) return;
      const id = window.setInterval(() => {
        setIndex((i) => (i + 1) % words.length);
      }, intervalMs);
      return () => window.clearInterval(id);
    }, [cycle, intervalMs, words.length]);

    const currentWord = words[index % words.length] ?? "Thinking";
    const spacerWord = words.reduce(
      (a, b) => (a.length >= b.length ? a : b),
      "Thinking",
    );

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={currentWord}
        className={cn("flex items-center gap-2 px-3 py-2", className)}
        {...props}
      >
        <motion.svg
          aria-hidden
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-muted-foreground"
        >
          <motion.path
            animate={
              reduceMotion
                ? undefined
                : {
                    d: [circleA, infinity, circleB, infinity, circleA],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    d: {
                      duration: 6,
                      ease: "easeInOut",
                      repeat: Infinity,
                      times: [0, 0.25, 0.5, 0.75, 1.0],
                    },
                  }
            }
          />
        </motion.svg>
        <span className="inline-grid overflow-hidden text-[13px] font-medium">
          <span
            className={cn(
              "col-start-1 row-start-1 invisible",
              !reduceMotion && "shimmer-text",
            )}
            aria-hidden
          >
            {spacerWord}
          </span>
          {cycle ? (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={currentWord}
                className="col-start-1 row-start-1 shimmer-text"
                initial={{ y: "80%", opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  transition: { duration: 0.24, ease: [0.4, 0, 0.2, 1] },
                }}
                exit={{
                  y: "-80%",
                  opacity: 0,
                  transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] },
                }}
              >
                {currentWord}
              </motion.span>
            </AnimatePresence>
          ) : (
            <span
              className={cn(
                "col-start-1 row-start-1",
                reduceMotion ? "text-muted-foreground" : "shimmer-text",
              )}
            >
              {currentWord}
            </span>
          )}
        </span>
      </div>
    );
  },
);

ThinkingIndicator.displayName = "ThinkingIndicator";
