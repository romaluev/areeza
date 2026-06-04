"use client";

import { useCallback, useRef } from "react";

/** Prevents double-submit / double-click on destructive or slow actions. */
export function useIdempotentAction() {
  const busyRef = useRef(false);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (busyRef.current) return undefined;
    busyRef.current = true;
    try {
      return await fn();
    } finally {
      busyRef.current = false;
    }
  }, []);

  const isBusy = useCallback(() => busyRef.current, []);

  return { run, isBusy };
}
