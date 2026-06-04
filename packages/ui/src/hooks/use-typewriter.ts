"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

export interface UseTypewriterOptions {
  /** Chars revealed per tick (default 2). */
  chunkSize?: number;
  /** Ms between ticks (default 16). */
  intervalMs?: number;
  /** When true, show full text immediately. */
  instant?: boolean;
  /** Reset when target text changes. */
  resetOnChange?: boolean;
}

/**
 * Appends characters into displayed text for streaming document sections.
 */
export function useTypewriter(
  target: string,
  options: UseTypewriterOptions = {},
) {
  const {
    chunkSize = 2,
    intervalMs = 16,
    instant: instantOverride,
    resetOnChange = true,
  } = options;

  const prefersReduced = useReducedMotion();
  const instant = instantOverride ?? prefersReduced;
  const [displayed, setDisplayed] = useState(instant ? target : "");
  const indexRef = useRef(0);

  useEffect(() => {
    if (resetOnChange) {
      indexRef.current = 0;
      setDisplayed(instant ? target : "");
    }
  }, [target, instant, resetOnChange]);

  useEffect(() => {
    if (instant) {
      setDisplayed(target);
      indexRef.current = target.length;
      return;
    }

    if (indexRef.current >= target.length) return;

    const id = window.setInterval(() => {
      indexRef.current = Math.min(target.length, indexRef.current + chunkSize);
      setDisplayed(target.slice(0, indexRef.current));
      if (indexRef.current >= target.length) {
        window.clearInterval(id);
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [target, instant, chunkSize, intervalMs]);

  const isComplete = displayed.length >= target.length;

  return { displayed, isComplete };
}
