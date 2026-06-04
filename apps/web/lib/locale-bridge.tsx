"use client";

import { useEffect } from "react";
import { useIntakeStore } from "@/lib/use-intake-store";

/** Keeps `document.documentElement.lang` aligned with intake locale (uz | ru). */
export function LocaleBridge() {
  const locale = useIntakeStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale === "ru" ? "ru" : "uz";
  }, [locale]);

  return null;
}
