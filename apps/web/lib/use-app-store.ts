"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePref = "light" | "dark" | "system";
export type DensityPref = "comfortable" | "compact";
export type ShapePref = "default" | "pill";

type AppPrefsState = {
  theme: ThemePref;
  density: DensityPref;
  shape: ShapePref;
  _hasHydrated: boolean;
  setTheme: (theme: ThemePref) => void;
  setDensity: (density: DensityPref) => void;
  setShape: (shape: ShapePref) => void;
  setHasHydrated: (value: boolean) => void;
};

export const useAppStore = create<AppPrefsState>()(
  persist(
    (set) => ({
      theme: "system",
      density: "comfortable",
      shape: "pill",
      _hasHydrated: false,
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setShape: (shape) => set({ shape }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "areeza-app-prefs",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        density: state.density,
        shape: state.shape,
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
