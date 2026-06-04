"use client";

import { useCallback } from "react";
import type { AppLocale } from "@/lib/copy";
import { useAppStore } from "@/lib/use-app-store";
import { syncAllIntakeLocales } from "@/lib/use-intake-store";

export function useAppLocale() {
  const locale = useAppStore((s) => s.locale);
  const setAppLocale = useAppStore((s) => s.setLocale);

  const setLocale = useCallback(
    (next: AppLocale) => {
      setAppLocale(next);
      syncAllIntakeLocales(next);
    },
    [setAppLocale],
  );

  return { locale, setLocale };
}
