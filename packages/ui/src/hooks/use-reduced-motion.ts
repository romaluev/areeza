"use client";

import { useEffect, useState } from "react";
import type { Transition } from "framer-motion";
import { springs } from "../motion/springs";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/** Returns `{ duration: 0 }` when the user prefers reduced motion. */
export function useMotionTransition(
  preset: keyof typeof springs = "moderate",
): Transition {
  const reduced = useReducedMotion();
  if (reduced) {
    return { duration: 0 };
  }
  return springs[preset];
}

export const reducedMotionClass =
  "motion-reduce:transition-none motion-reduce:animate-none";
