"use client";

import { useCallback, useEffect, useRef } from "react";

const THRESHOLD_PX = 80;

/**
 * Keeps the transcript pinned when the user is near the bottom (80px).
 * During streaming, scroll is instant; otherwise smooth.
 */
export function useStickToBottom(
  deps: unknown[],
  streaming: boolean,
) {
  const viewportRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const distance =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;

    if (streaming || distance <= THRESHOLD_PX) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: streaming ? "instant" : "smooth",
      });
    }
  }, [streaming]);

  useEffect(() => {
    scrollToEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps drive scroll on content change
  }, [...deps, streaming, scrollToEnd]);

  return { viewportRef };
}
