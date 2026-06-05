"use client";

import { createContext, useContext, type ReactNode } from "react";

// Numeric surface-depth context used by the vendored FF components (Tabs).
// Mirrors the FF registry's `surface-context`: a 1-8 substrate level. Kept
// separate from Areeza's `lib/surface-context.tsx` (which returns an object)
// so vendored components stay drop-in.

const FfSurfaceContext = createContext<number>(1);

export function useSurface(): number {
  return useContext(FfSurfaceContext);
}

export function FfSurfaceProvider({
  value,
  children,
}: {
  value: number;
  children: ReactNode;
}) {
  return (
    <FfSurfaceContext.Provider value={Math.max(1, Math.min(8, value))}>
      {children}
    </FfSurfaceContext.Provider>
  );
}
