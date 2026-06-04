"use client";

import { useCallback, useEffect, useRef } from "react";

const DEFAULT_THRESHOLD_PX = 80;

export interface UseStickToBottomOptions {
  /** Distance from bottom (px) to treat the user as “pinned”. */
  thresholdPx?: number;
  /** Dependencies that should trigger a scroll attempt when pinned. */
  deps?: unknown[];
}

/**
 * Keeps a scroll container pinned to the bottom while the user is near the end.
 * Uses instant scroll during rapid updates to avoid smooth-scroll jank.
 */
export function useStickToBottom({
  thresholdPx = DEFAULT_THRESHOLD_PX,
  deps = [],
}: UseStickToBottomOptions = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef(true);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
  }, [thresholdPx]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      pinnedRef.current = isNearBottom();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isNearBottom]);

  useEffect(() => {
    if (!pinnedRef.current && !isNearBottom()) return;
    pinnedRef.current = true;
    scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies deps
  }, deps);

  return {
    containerRef,
    scrollToBottom,
    isPinned: () => pinnedRef.current,
  };
}
