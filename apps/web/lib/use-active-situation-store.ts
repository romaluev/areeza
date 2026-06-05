"use client";

import { create } from "zustand";

/**
 * The situation + workspace step currently open in the canvas. Published by the
 * workspace, consumed by the shell-level assistant rail so it knows what to show
 * without parsing the pathname. Mirrors the top-bar-store shell↔page channel.
 */
interface ActiveSituationState {
  situationId: string | null;
  step: string | null;
  setActive: (situationId: string, step: string) => void;
  clear: () => void;
}

export const useActiveSituationStore = create<ActiveSituationState>((set) => ({
  situationId: null,
  step: null,
  setActive: (situationId, step) => set({ situationId, step }),
  clear: () => set({ situationId: null, step: null }),
}));
