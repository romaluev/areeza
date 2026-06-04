"use client";

import {
  createContext,
  useContext,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useSurface, type SurfaceLevel } from "./surface-context";

export type ShapeDensity = "tight" | "default" | "soft";
export type ShapePreset = "default" | "pill";

interface ShapeContextValue {
  density: ShapeDensity;
  preset: ShapePreset;
}

const ShapeContext = createContext<ShapeContextValue | null>(null);

const RADIUS_BY_SURFACE: Record<SurfaceLevel, string> = {
  1: "var(--radius-sm)",
  2: "var(--radius-sm)",
  3: "var(--radius-md)",
  4: "var(--radius-md)",
  5: "var(--radius-lg)",
  6: "var(--radius-lg)",
  7: "var(--radius-xl)",
  8: "var(--radius-2xl)",
};

const DENSITY_OFFSET: Record<ShapeDensity, number> = {
  tight: -1,
  default: 0,
  soft: 1,
};

function radiusFor(
  level: SurfaceLevel,
  density: ShapeDensity,
  preset: ShapePreset,
): string {
  if (preset === "pill") return "var(--radius-pill)";
  const adjusted = Math.min(8, Math.max(1, level + DENSITY_OFFSET[density]));
  return RADIUS_BY_SURFACE[adjusted as SurfaceLevel];
}

export interface ShapeProviderProps {
  children: ReactNode;
  density?: ShapeDensity;
  preset?: ShapePreset;
}

export function ShapeProvider({
  children,
  density = "default",
  preset = "default",
}: ShapeProviderProps) {
  const value = useMemo(() => ({ density, preset }), [density, preset]);
  return (
    <ShapeContext.Provider value={value}>{children}</ShapeContext.Provider>
  );
}

export function useShape(): ShapeContextValue {
  const ctx = useContext(ShapeContext);
  return ctx ?? { density: "default", preset: "default" };
}

export function useShapeStyle(): Pick<CSSProperties, "borderRadius"> {
  const { level } = useSurface();
  const { density, preset } = useShape();
  return useMemo(
    () => ({
      borderRadius: radiusFor(level, density, preset),
    }),
    [level, density, preset],
  );
}

export function useShapeRadius(): string {
  const { level } = useSurface();
  const { density, preset } = useShape();
  return radiusFor(level, density, preset);
}
