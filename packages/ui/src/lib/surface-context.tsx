"use client";

import {
  createContext,
  useContext,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "./utils";
import { surfaceClasses } from "./surface-classes";

export const SURFACE_MIN = 1 as const;
export const SURFACE_MAX = 8 as const;

export type SurfaceLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface SurfaceContextValue {
  level: SurfaceLevel;
}

const SurfaceContext = createContext<SurfaceContextValue | null>(null);

function clampSurfaceLevel(level: number): SurfaceLevel {
  const clamped = Math.min(SURFACE_MAX, Math.max(SURFACE_MIN, Math.round(level)));
  return clamped as SurfaceLevel;
}

export interface SurfaceProviderProps {
  children: ReactNode;
  level?: number;
}

export function SurfaceProvider({ children, level }: SurfaceProviderProps) {
  const parent = useContext(SurfaceContext);
  const resolved = clampSurfaceLevel(
    level ?? (parent ? parent.level + 1 : SURFACE_MIN),
  );

  const value = useMemo(() => ({ level: resolved }), [resolved]);

  return (
    <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>
  );
}

export function useSurface(): SurfaceContextValue {
  const ctx = useContext(SurfaceContext);
  if (!ctx) {
    return { level: SURFACE_MIN };
  }
  return ctx;
}

export function surfaceToken(level: SurfaceLevel): `--surface-${SurfaceLevel}` {
  return `--surface-${level}`;
}

export function useSurfaceStyle(
  offset = 0,
): Pick<CSSProperties, "backgroundColor"> {
  const { level } = useSurface();
  const tokenLevel = clampSurfaceLevel(level + offset);
  return useMemo(
    () => ({
      backgroundColor: `var(${surfaceToken(tokenLevel)})`,
    }),
    [tokenLevel],
  );
}

export function useSurfaceLevel(): SurfaceLevel {
  return useSurface().level;
}

export function useSurfaceClassName(): string {
  const { level } = useSurface();
  return `bg-[var(--surface-${level})]`;
}

export interface ElevatedProps {
  children: ReactNode;
  className?: string;
  offset?: number;
  shadowLevel?: number;
  style?: CSSProperties;
}

export function Elevated({
  children,
  className,
  offset = 1,
  shadowLevel,
  style,
}: ElevatedProps) {
  const { level } = useSurface();
  const tokenLevel = clampSurfaceLevel(level + offset);
  const resolvedShadow = shadowLevel ?? tokenLevel;

  return (
    <SurfaceProvider level={tokenLevel}>
      <div
        className={cn(
          "ring-1 ring-foreground/10",
          surfaceClasses(tokenLevel, resolvedShadow),
          className,
        )}
        style={style}
        data-surface={tokenLevel}
      >
        {children}
      </div>
    </SurfaceProvider>
  );
}
