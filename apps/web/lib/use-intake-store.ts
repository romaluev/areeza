"use client";

import { create, useStore, type StoreApi } from "zustand";
import type { CaseFact, CaseMessage, Classification } from "@areeza/core/types";

type IntakeLocale = "uz" | "ru";

export type IntakeSurfaceId = "new-case" | `situation:${string}`;

export const NEW_CASE_INTAKE_SURFACE: IntakeSurfaceId = "new-case";

export function situationIntakeSurface(situationId: string): IntakeSurfaceId {
  return `situation:${situationId}`;
}

type IntakeState = {
  locale: IntakeLocale;
  messages: CaseMessage[];
  facts: CaseFact[];
  streaming: boolean;
  assistantBuffer: string;
  classification: Classification | null;
  setLocale: (locale: IntakeLocale) => void;
  addMessage: (msg: CaseMessage) => void;
  appendAssistant: (delta: string) => void;
  flushAssistant: () => void;
  addFact: (fact: CaseFact) => void;
  setClassification: (c: Classification) => void;
  setStreaming: (v: boolean) => void;
  reset: () => void;
};

const initialSlice = {
  locale: "uz" as IntakeLocale,
  messages: [] as CaseMessage[],
  facts: [] as CaseFact[],
  streaming: false,
  assistantBuffer: "",
  classification: null as Classification | null,
};

function createIntakeStore(): StoreApi<IntakeState> {
  return create<IntakeState>((set, get) => ({
    ...initialSlice,
    setLocale: (locale) => set({ locale }),
    addMessage: (msg) => set({ messages: [...get().messages, msg] }),
    appendAssistant: (delta) =>
      set({ assistantBuffer: get().assistantBuffer + delta }),
    flushAssistant: () => {
      const buf = get().assistantBuffer.trim();
      if (buf) {
        set({
          messages: [
            ...get().messages,
            {
              id: `asst-${Date.now()}`,
              role: "assistant",
              content: buf,
              createdAt: new Date().toISOString(),
            },
          ],
          assistantBuffer: "",
        });
      }
    },
    addFact: (fact) => {
      const existing = get().facts.findIndex((f) => f.key === fact.key);
      const facts = [...get().facts];
      if (existing >= 0) facts[existing] = fact;
      else facts.push(fact);
      set({ facts });
    },
    setClassification: (classification) => set({ classification }),
    setStreaming: (streaming) => set({ streaming }),
    reset: () => set({ ...initialSlice }),
  }));
}

const storeBySurface = new Map<IntakeSurfaceId, StoreApi<IntakeState>>();

export function getIntakeStore(surface: IntakeSurfaceId = NEW_CASE_INTAKE_SURFACE) {
  let store = storeBySurface.get(surface);
  if (!store) {
    store = createIntakeStore();
    storeBySurface.set(surface, store);
  }
  return store;
}

export function syncAllIntakeLocales(locale: IntakeLocale) {
  for (const store of storeBySurface.values()) {
    store.getState().setLocale(locale);
  }
}

export function useIntakeStore(): IntakeState;
export function useIntakeStore(surface: IntakeSurfaceId): IntakeState;
export function useIntakeStore<T>(selector: (state: IntakeState) => T): T;
export function useIntakeStore<T>(
  surface: IntakeSurfaceId,
  selector: (state: IntakeState) => T,
): T;
export function useIntakeStore<T>(
  surfaceOrSelector?: IntakeSurfaceId | ((state: IntakeState) => T),
  maybeSelector?: (state: IntakeState) => T,
): T | IntakeState {
  const surface: IntakeSurfaceId =
    typeof surfaceOrSelector === "string"
      ? surfaceOrSelector
      : NEW_CASE_INTAKE_SURFACE;
  const selector =
    typeof surfaceOrSelector === "function"
      ? surfaceOrSelector
      : (maybeSelector ?? ((state: IntakeState) => state));
  const store = getIntakeStore(surface);
  return useStore(store, selector as (state: IntakeState) => T);
}
