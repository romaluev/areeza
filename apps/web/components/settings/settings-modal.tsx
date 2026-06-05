"use client";

import { Segmented } from "@areeza/ui/components/segmented";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@areeza/ui/components/dialog";
import { uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import {
  useAppStore,
  type DensityPref,
  type ShapePref,
  type ThemePref,
} from "@/lib/use-app-store";
import type { AppLocale } from "@/lib/copy";
import { useSettingsStore } from "@/lib/use-settings-store";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}

/**
 * Single shared appearance-settings modal. Writes only to `useAppStore` /
 * `useAppLocale`; the AppPrefsBridge + LocaleBridge propagate everything
 * (theme→next-themes, density/shape→data-* attrs, locale→intake + <html lang>),
 * so changes apply live and round-trip across reloads via localStorage.
 */
export function SettingsModal() {
  const open = useSettingsStore((s) => s.open);
  const setOpen = useSettingsStore((s) => s.setOpen);
  const { locale, setLocale } = useAppLocale();
  const copy = uiCopy(locale);

  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const density = useAppStore((s) => s.density);
  const setDensity = useAppStore((s) => s.setDensity);
  const shape = useAppStore((s) => s.shape);
  const setShape = useAppStore((s) => s.setShape);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.settingsTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col divide-y divide-border">
          <Row label={copy.settingsTheme}>
            <Segmented<ThemePref>
              value={theme}
              onValueChange={setTheme}
              aria-label={copy.settingsTheme}
              options={[
                { value: "light", label: copy.settingsThemeLight },
                { value: "dark", label: copy.settingsThemeDark },
                { value: "system", label: copy.settingsThemeSystem },
              ]}
            />
          </Row>

          <Row label={copy.settingsLanguage}>
            <Segmented<AppLocale>
              value={locale}
              onValueChange={setLocale}
              aria-label={copy.settingsLanguage}
              options={[
                { value: "uz", label: "UZ" },
                { value: "ru", label: "RU" },
              ]}
            />
          </Row>

          <Row label={copy.settingsDensity}>
            <Segmented<DensityPref>
              value={density}
              onValueChange={setDensity}
              aria-label={copy.settingsDensity}
              options={[
                { value: "comfortable", label: copy.settingsDensityComfortable },
                { value: "compact", label: copy.settingsDensityCompact },
              ]}
            />
          </Row>

          <Row label={copy.settingsShape}>
            <Segmented<ShapePref>
              value={shape}
              onValueChange={setShape}
              aria-label={copy.settingsShape}
              options={[
                { value: "default", label: copy.settingsShapeDefault },
                { value: "pill", label: copy.settingsShapePill },
              ]}
            />
          </Row>
        </div>
      </DialogContent>
    </Dialog>
  );
}
