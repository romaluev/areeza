"use client";

import { create } from "zustand";

/** Visibility of the persistent assistant rail (desktop column / mobile Sheet). */
interface RightRailState {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

export const useRightRailStore = create<RightRailState>((set, get) => ({
  open: false,
  toggle: () => set({ open: !get().open }),
  setOpen: (open) => set({ open }),
}));
