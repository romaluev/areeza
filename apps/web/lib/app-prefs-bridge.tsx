"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAppStore } from "@/lib/use-app-store";

/**
 * Applies persisted UI prefs after client hydration (SSR-safe).
 * Syncs zustand theme preference with next-themes.
 */
export function AppPrefsBridge() {
  const { setTheme } = useTheme();
  const theme = useAppStore((s) => s.theme);
  const density = useAppStore((s) => s.density);
  const shape = useAppStore((s) => s.shape);
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const setHasHydrated = useAppStore((s) => s.setHasHydrated);

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    if (useAppStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return unsub;
  }, [setHasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    setTheme(theme);
  }, [hasHydrated, setTheme, theme]);

  useEffect(() => {
    if (!hasHydrated) return;
    const root = document.documentElement;
    root.dataset.density = density;
    root.dataset.shape = shape;
  }, [density, hasHydrated, shape]);

  return null;
}
