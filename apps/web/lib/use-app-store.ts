"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AppLocale } from "@/lib/copy";

export type ThemePref = "light" | "dark" | "system";
export type DensityPref = "comfortable" | "compact";
export type ShapePref = "default" | "pill";

type AppPrefsState = {
  theme: ThemePref;
  density: DensityPref;
  shape: ShapePref;
  locale: AppLocale;
  _hasHydrated: boolean;
  setTheme: (theme: ThemePref) => void;
  setDensity: (density: DensityPref) => void;
  setShape: (shape: ShapePref) => void;
  setLocale: (locale: AppLocale) => void;
  setHasHydrated: (value: boolean) => void;
};

export const useAppStore = create<AppPrefsState>()(
  persist(
    (set) => ({
      theme: "system",
      density: "comfortable",
      shape: "pill",
      locale: "uz",
      _hasHydrated: false,
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setShape: (shape) => set({ shape }),
      setLocale: (locale) => set({ locale }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "areeza-app-prefs",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        density: state.density,
        shape: state.shape,
        locale: state.locale,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useAppPrefsHydrated(): boolean {
  return useAppStore((s) => s._hasHydrated);
}
