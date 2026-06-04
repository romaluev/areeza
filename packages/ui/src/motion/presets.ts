export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export { springTransition as spring };

export const motionPresets = {
  fast: { duration: 0.15 },
  base: { duration: 0.25 },
  slow: { duration: 0.4 },
};

export const reducedMotionClass =
  "motion-reduce:transition-none motion-reduce:animate-none";
