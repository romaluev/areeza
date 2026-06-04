import type { Transition } from "framer-motion";

/** FF micro-interactions (plan craft spec). */
export const springs = {
  fast: { type: "spring", duration: 0.08, bounce: 0 },
  moderate: { type: "spring", duration: 0.16, bounce: 0.15 },
  slow: { type: "spring", duration: 0.24, bounce: 0.15 },
  snappy: {
    type: "spring",
    stiffness: 520,
    damping: 38,
    mass: 0.7,
  },
  gentle: {
    type: "spring",
    stiffness: 320,
    damping: 32,
    mass: 0.85,
  },
  soft: {
    type: "spring",
    stiffness: 220,
    damping: 28,
    mass: 1,
  },
  settle: {
    type: "spring",
    stiffness: 180,
    damping: 26,
    mass: 1.1,
  },
} as const satisfies Record<string, Transition>;

export type SpringPreset = keyof typeof springs;
