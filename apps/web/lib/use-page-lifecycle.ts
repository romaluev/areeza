"use client";

import { useEffect } from "react";

/** Warn before unload when there are unsaved local changes. */
export function useBeforeUnloadGuard(active: boolean, message?: string) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message ?? "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active, message]);
}

/**
 * BFCache restore: `pageshow` with `persisted` fires when the user returns via back/forward.
 * Call `onRestore` so callers can re-read localStorage drafts.
 */
export function useBfcacheRestore(onRestore: () => void) {
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) onRestore();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, [onRestore]);
}
