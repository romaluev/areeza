"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// Fluid Functionalism element-keyed shape system. Distinct from Areeza's
// surface-aware `lib/shape-context.tsx` (which exposes `{ preset, density }`):
// this one returns concrete radius class strings per element type and is what
// the vendored FF components (ChatMessage, AskUserQuestions, ThinkingSteps,
// Tabs) consume via `useShape()`. Radii resolve against Areeza's own
// `--radius-*` tokens, so no values are hardcoded outside the pill literal.

export type ShapeVariant = "pill" | "rounded";

export interface ShapeClasses {
  item: string;
  bg: string;
  focusRing: string;
  mergedBg: string;
  container: string;
  button: string;
  input: string;
  /** Numeric counterparts (px) for per-corner animated radii. */
  bgRadius: number;
  mergedRadius: number;
}

const shapeMap: Record<ShapeVariant, ShapeClasses> = {
  pill: {
    item: "rounded-2xl",
    bg: "rounded-2xl",
    focusRing: "rounded-[22px]",
    mergedBg: "rounded-2xl",
    // Container matches Areeza's pane/card language (20px) instead of FF's 36px
    // so option cards / tab tracks sit flush with the rest of the chrome.
    container: "rounded-2xl",
    button: "rounded-2xl",
    input: "rounded-2xl",
    bgRadius: 20,
    mergedRadius: 16,
  },
  rounded: {
    item: "rounded-lg",
    bg: "rounded-lg",
    focusRing: "rounded-[10px]",
    mergedBg: "rounded-lg",
    container: "rounded-xl",
    button: "rounded-lg",
    input: "rounded-lg",
    bgRadius: 8,
    mergedRadius: 8,
  },
};

interface ShapeContextValue {
  shape: ShapeVariant;
  setShape: (shape: ShapeVariant) => void;
  classes: ShapeClasses;
}

const FfShapeContext = createContext<ShapeContextValue | null>(null);

/** Element-keyed radius classes. Falls back to `pill` with no provider. */
export function useShape(): ShapeClasses {
  const ctx = useContext(FfShapeContext);
  return ctx ? ctx.classes : shapeMap.pill;
}

export function useShapeContext(): ShapeContextValue {
  const ctx = useContext(FfShapeContext);
  if (!ctx) throw new Error("useShapeContext must be used within an FfShapeProvider");
  return ctx;
}

export function FfShapeProvider({
  children,
  shape: controlledShape,
  defaultShape = "pill",
}: {
  children: ReactNode;
  /** Controlled variant — when set, mirrors the app shape preference. */
  shape?: ShapeVariant;
  defaultShape?: ShapeVariant;
}) {
  const [internal, setInternal] = useState<ShapeVariant>(defaultShape);
  const shape = controlledShape ?? internal;
  const setShape = useCallback((next: ShapeVariant) => setInternal(next), []);
  const value = useMemo<ShapeContextValue>(
    () => ({ shape, setShape, classes: shapeMap[shape] }),
    [shape, setShape],
  );
  return <FfShapeContext.Provider value={value}>{children}</FfShapeContext.Provider>;
}

export { shapeMap };
