"use client";

import { Segmented } from "@areeza/ui/components/segmented";
import type { AppLocale } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";

export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useAppLocale();

  return (
    <Segmented<AppLocale>
      value={locale}
      onValueChange={setLocale}
      aria-label={locale === "ru" ? "Язык интерфейса" : "Interfeys tili"}
      className={className}
      options={[
        { value: "uz", label: "UZ" },
        { value: "ru", label: "RU" },
      ]}
    />
  );
}
