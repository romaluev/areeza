import type { Transition } from "framer-motion";
import { springs } from "./springs";

/** Aligned with `--dur-*` in tokens.css (seconds). */
const DUR_FAST_S = 0.12;
const DUR_NORMAL_S = 0.2;
const DUR_SLOW_S = 0.32;

export const springTransition: Transition = springs.snappy;

export { springTransition as spring };

export const motionPresets = {
  fast: { duration: DUR_FAST_S },
  base: { duration: DUR_NORMAL_S },
  slow: { duration: DUR_SLOW_S },
} as const;

export { reducedMotionClass } from "../hooks/use-reduced-motion";
