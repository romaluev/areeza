"use client";

import { create } from "zustand";
import type { CaseFact, CaseMessage, Classification } from "@areeza/core/types";

type IntakeLocale = "uz" | "ru";

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

export const useIntakeStore = create<IntakeState>((set, get) => ({
  locale: "uz",
  messages: [],
  facts: [],
  streaming: false,
  assistantBuffer: "",
  classification: null,
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
  reset: () =>
    set({
      messages: [],
      facts: [],
      streaming: false,
      assistantBuffer: "",
      classification: null,
    }),
}));
