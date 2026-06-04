"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { api } from "@areeza/core/api";
import type { DraftStreamEvent, GeneratedDocument } from "@areeza/core/types";

export type StreamingSectionState = {
  id: string;
  kind: GeneratedDocument["sections"][number]["kind"];
  content: string;
  done: boolean;
};

export function useDocumentStream(caseId: string, docId: string) {
  const [streaming, setStreaming] = useState(false);
  const [sections, setSections] = useState<StreamingSectionState[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [completedDoc, setCompletedDoc] = useState<GeneratedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setActiveSectionId(null);
  }, []);

  const start = useCallback(async () => {
    cancel();
    setError(null);
    setCompletedDoc(null);
    setSections([]);
    setActiveSectionId(null);

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    try {
      for await (const event of api.streamDraft(caseId, docId, controller.signal)) {
        if (controller.signal.aborted) break;
        applyStreamEvent(event, {
          setSections,
          setActiveSectionId,
          setCompletedDoc,
        });
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Hujjat yaratilmadi");
    } finally {
      if (!controller.signal.aborted) {
        setStreaming(false);
        setActiveSectionId(null);
      }
      abortRef.current = null;
    }
  }, [caseId, docId, cancel]);

  useEffect(() => () => cancel(), [cancel]);

  return {
    streaming,
    sections,
    activeSectionId,
    completedDoc,
    error,
    start,
    cancel,
  };
}

function applyStreamEvent(
  event: DraftStreamEvent,
  ctx: {
    setSections: Dispatch<SetStateAction<StreamingSectionState[]>>;
    setActiveSectionId: Dispatch<SetStateAction<string | null>>;
    setCompletedDoc: Dispatch<SetStateAction<GeneratedDocument | null>>;
  },
) {
  switch (event.type) {
    case "section_start":
      ctx.setActiveSectionId(event.sectionId);
      ctx.setSections((prev) => {
        const existing = prev.find((s) => s.id === event.sectionId);
        if (existing) {
          return prev.map((s) =>
            s.id === event.sectionId ? { ...s, done: false, content: "" } : s,
          );
        }
        return [
          ...prev,
          {
            id: event.sectionId,
            kind: event.kind,
            content: "",
            done: false,
          },
        ];
      });
      break;
    case "chunk":
      ctx.setSections((prev) =>
        prev.map((s) =>
          s.id === event.sectionId ? { ...s, content: s.content + event.delta } : s,
        ),
      );
      break;
    case "section_done":
      ctx.setSections((prev) =>
        prev.map((s) =>
          s.id === event.sectionId ? { ...s, content: event.content, done: true } : s,
        ),
      );
      break;
    case "done":
      ctx.setCompletedDoc(event.document);
      break;
    default:
      break;
  }
}
