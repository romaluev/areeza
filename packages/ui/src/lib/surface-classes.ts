import type { SurfaceLevel } from "./surface-context";

export const SURFACE_BG: Record<SurfaceLevel, string> = {
  1: "bg-surface-1",
  2: "bg-surface-2",
  3: "bg-surface-3",
  4: "bg-surface-4",
  5: "bg-surface-5",
  6: "bg-surface-6",
  7: "bg-surface-7",
  8: "bg-surface-8",
};

export const SURFACE_SHADOW: Record<SurfaceLevel, string> = {
  1: "shadow-surface-1",
  2: "shadow-surface-2",
  3: "shadow-surface-3",
  4: "shadow-surface-4",
  5: "shadow-surface-5",
  6: "shadow-surface-6",
  7: "shadow-surface-7",
  8: "shadow-surface-8",
};

function clampLevel(level: number): SurfaceLevel {
  const clamped = Math.min(8, Math.max(1, Math.round(level)));
  return clamped as SurfaceLevel;
}

export const surfaceTransition =
  "transition-[box-shadow,background-color] duration-[var(--dur-normal)] ease-[var(--ease-std)]";

export function surfaceClasses(
  bgLevel: number,
  shadowLevel: number = bgLevel,
): string {
  const bg = clampLevel(bgLevel);
  const shadow = clampLevel(shadowLevel);
  return `${SURFACE_BG[bg]} ${SURFACE_SHADOW[shadow]} ${surfaceTransition}`;
}
