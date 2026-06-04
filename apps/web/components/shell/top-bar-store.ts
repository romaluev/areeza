"use client";

import { create } from "zustand";
import type { ReactNode } from "react";

export interface TopBarConfig {
  title?: ReactNode;
  description?: string;
  actions?: ReactNode;
}

interface TopBarState {
  config: TopBarConfig | null;
  setConfig: (config: TopBarConfig | null) => void;
}

export const useTopBarStore = create<TopBarState>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));
