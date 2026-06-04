"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/use-app-store";
import { syncAllIntakeLocales, useIntakeStore } from "@/lib/use-intake-store";

/** Keeps `document.documentElement.lang` and intake locale aligned with app prefs. */
export function LocaleBridge() {
  const appLocale = useAppStore((s) => s.locale);
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const intakeLocale = useIntakeStore((s) => s.locale);

  useEffect(() => {
    if (!hasHydrated) return;
    if (intakeLocale !== appLocale) {
      syncAllIntakeLocales(appLocale);
    }
  }, [appLocale, hasHydrated, intakeLocale]);

  useEffect(() => {
    const lang = (hasHydrated ? appLocale : intakeLocale) === "ru" ? "ru" : "uz";
    document.documentElement.lang = lang;
  }, [appLocale, hasHydrated, intakeLocale]);

  return null;
}
