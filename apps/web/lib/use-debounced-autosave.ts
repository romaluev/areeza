"use client";

import { useCallback, useEffect, useRef } from "react";
import { removeStorage, writeStorageJson } from "./storage";
import { useBeforeUnloadGuard, useBfcacheRestore } from "./use-page-lifecycle";

export function useDebouncedAutosave<T>({
  storageKey,
  value,
  enabled = true,
  delayMs = 500,
  dirty = true,
}: {
  storageKey: string;
  value: T;
  enabled?: boolean;
  delayMs?: number;
  /** When false, skips persist (e.g. pristine / server-synced state). */
  dirty?: boolean;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const valueRef = useRef(value);
  valueRef.current = value;

  const flush = useCallback(() => {
    if (!enabled || !dirty) return;
    writeStorageJson(storageKey, {
      ...valueRef.current,
      savedAt: new Date().toISOString(),
    });
  }, [storageKey, enabled, dirty]);

  useEffect(() => {
    if (!enabled || !dirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled, dirty, delayMs, flush]);

  useEffect(() => () => flush(), [flush]);

  useBeforeUnloadGuard(enabled && dirty);
  useBfcacheRestore(flush);

  return { flush, clear: () => removeStorage(storageKey) };
}
