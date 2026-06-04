"use client";

import { type RefObject, useEffect, useRef } from "react";

const HIGHLIGHT_ID_ATTR = "data-nav-highlight-id";

/**
 * Sets data-proximity on the nearest vertical nav row while the pointer is inside the menu.
 * Uses rAF throttling and DOM attributes only (no React state per move).
 */
export function useNavProximity(
  menuRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const rafRef = useRef<number | null>(null);
  const proximityIdRef = useRef<string | null>(null);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu || !enabled) return;

    const applyProximity = (id: string | null) => {
      if (id === proximityIdRef.current) return;
      proximityIdRef.current = id;
      menu.querySelectorAll<HTMLElement>(`[${HIGHLIGHT_ID_ATTR}]`).forEach((el) => {
        if (id && el.getAttribute(HIGHLIGHT_ID_ATTR) === id) {
          el.setAttribute("data-proximity", "");
        } else {
          el.removeAttribute("data-proximity");
        }
      });
    };

    const updateFromY = (clientY: number) => {
      const items = menu.querySelectorAll<HTMLElement>(`[${HIGHLIGHT_ID_ATTR}]`);
      let nearestId: string | null = null;
      let nearestDist = Number.POSITIVE_INFINITY;

      items.forEach((el) => {
        const id = el.getAttribute(HIGHLIGHT_ID_ATTR);
        if (!id) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(clientY - center);
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
        updateFromY(event.clientY);
      });
    };

    const onPointerLeave = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      applyProximity(null);
    };

    menu.addEventListener("pointermove", onPointerMove);
    menu.addEventListener("pointerleave", onPointerLeave);

    return () => {
      menu.removeEventListener("pointermove", onPointerMove);
      menu.removeEventListener("pointerleave", onPointerLeave);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      applyProximity(null);
    };
  }, [enabled, menuRef]);
}

export function resolveNavHighlightId(menu: HTMLElement): string | null {
  const hoveredButton = menu.querySelector<HTMLElement>(
    '[data-sidebar="menu-button"]:hover',
  );
  const hovered = hoveredButton?.closest<HTMLElement>(
    `[data-sidebar="menu-item"][${HIGHLIGHT_ID_ATTR}]`,
  );
  if (hovered) return hovered.getAttribute(HIGHLIGHT_ID_ATTR);

  const proximity = menu.querySelector<HTMLElement>(
    `[data-sidebar="menu-item"][data-proximity][${HIGHLIGHT_ID_ATTR}]`,
  );
  if (proximity) return proximity.getAttribute(HIGHLIGHT_ID_ATTR);

  const active = menu.querySelector<HTMLElement>(
    `[data-sidebar="menu-item"][data-active][${HIGHLIGHT_ID_ATTR}]`,
  );
  return active?.getAttribute(HIGHLIGHT_ID_ATTR) ?? null;
}
