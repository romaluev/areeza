"use client";

import { create } from "zustand";

/** Open/close state for the shared settings modal (single instance in the shell). */
interface SettingsState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
