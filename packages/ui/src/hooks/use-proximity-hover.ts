"use client";

import { type RefObject, useEffect, useRef } from "react";

const DEFAULT_ID_ATTR = "data-proximity-id";

export interface UseProximityHoverOptions {
  enabled?: boolean;
  /** Attribute on each hover target (default `data-proximity-id`). */
  idAttr?: string;
  /** CSS selector for items inside the container. */
  itemSelector?: string;
  /** Use horizontal axis (tabs) instead of vertical (nav lists). */
  axis?: "x" | "y";
}

/**
 * Sets `data-proximity` on the nearest item while the pointer is inside the container.
 * rAF-throttled; DOM-only updates (no React state per move).
 */
export function useProximityHover(
  containerRef: RefObject<HTMLElement | null>,
  options: UseProximityHoverOptions = {},
) {
  const {
    enabled = true,
    idAttr = DEFAULT_ID_ATTR,
    itemSelector = `[${DEFAULT_ID_ATTR}]`,
    axis = "y",
  } = options;

  const rafRef = useRef<number | null>(null);
  const proximityIdRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const applyProximity = (id: string | null) => {
      if (id === proximityIdRef.current) return;
      proximityIdRef.current = id;
      container.querySelectorAll<HTMLElement>(itemSelector).forEach((el) => {
        if (id && el.getAttribute(idAttr) === id) {
          el.setAttribute("data-proximity", "");
        } else {
          el.removeAttribute("data-proximity");
        }
      });
    };

    const updateFromPointer = (clientX: number, clientY: number) => {
      const items = container.querySelectorAll<HTMLElement>(itemSelector);
      let nearestId: string | null = null;
      let nearestDist = Number.POSITIVE_INFINITY;

      items.forEach((el) => {
        const id = el.getAttribute(idAttr);
        if (!id) return;
        const rect = el.getBoundingClientRect();
        const center =
          axis === "x"
            ? rect.left + rect.width / 2
            : rect.top + rect.height / 2;
        const pointer = axis === "x" ? clientX : clientY;
        const dist = Math.abs(pointer - center);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestId = id;
        }
      });

      applyProximity(nearestId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateFromPointer(event.clientX, event.clientY);
      });
    };

    const onPointerLeave = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      applyProximity(null);
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      applyProximity(null);
    };
  }, [axis, containerRef, enabled, idAttr, itemSelector]);
}

export { DEFAULT_ID_ATTR as PROXIMITY_ID_ATTR };
