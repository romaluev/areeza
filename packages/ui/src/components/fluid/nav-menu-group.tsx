"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavProximity, resolveNavHighlightId } from "../../hooks/use-nav-proximity";
import { navMenuGroupScope } from "../../lib/nav-motion";
import { springs } from "../../motion/springs";
import { cn } from "../../lib/utils";

type NavMenuGroupContextValue = {
  highlightId: string | null;
  layoutId: string;
  reducedMotion: boolean;
};

const NavMenuGroupContext = createContext<NavMenuGroupContextValue | null>(null);

function useNavMenuGroup() {
  const ctx = useContext(NavMenuGroupContext);
  if (!ctx) {
    throw new Error("NavMenuHighlight must be used within NavMenuGroup");
  }
  return ctx;
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

export function NavMenuGroup({
  layoutId: layoutIdProp,
  children,
  className,
}: {
  /** Unique per menu instance (e.g. `sidebar-personal`, `sidebar-workspace`). */
  layoutId: string;
  /** Must be a single `SidebarMenu` element. */
  children: ReactElement<{ className?: string; ref?: Ref<HTMLElement> }>;
  className?: string;
}) {
  const menuRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const autoId = useId();
  const layoutId = layoutIdProp || `nav-highlight-${autoId}`;

  useNavProximity(menuRef, !reducedMotion);

  const syncHighlight = useCallback(() => {
    const menu = menuRef.current;
    if (!menu || reducedMotion) return;
    setHighlightId(resolveNavHighlightId(menu));
  }, [reducedMotion]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu || reducedMotion) return;

    syncHighlight();

    menu.addEventListener("pointermove", syncHighlight);
    menu.addEventListener("pointerleave", syncHighlight);
    menu.addEventListener("focusin", syncHighlight);
    menu.addEventListener("focusout", syncHighlight);

    return () => {
      menu.removeEventListener("pointermove", syncHighlight);
      menu.removeEventListener("pointerleave", syncHighlight);
      menu.removeEventListener("focusin", syncHighlight);
      menu.removeEventListener("focusout", syncHighlight);
    };
  }, [reducedMotion, syncHighlight]);

  const child = React.cloneElement(children, {
    ref: mergeRefs(menuRef, children.props.ref),
    className: cn(
      children.props.className,
      !reducedMotion && navMenuGroupScope,
      "relative",
      className,
    ),
    "data-nav-menu-group": "",
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <NavMenuGroupContext.Provider
      value={{ highlightId, layoutId, reducedMotion: !!reducedMotion }}
    >
      {child}
    </NavMenuGroupContext.Provider>
  );
}

/**
 * Sliding accent pill behind a sidebar row. Place as the first child of `SidebarMenuItem`.
 * Set `data-nav-highlight-id` on the same `SidebarMenuItem` for proximity + resolve.
 */
export function NavMenuHighlight({ id }: { id: string; isActive?: boolean }) {
  const { highlightId, layoutId, reducedMotion } = useNavMenuGroup();
  const show = !reducedMotion && highlightId === id;

  if (!show) return null;

  return (
    <motion.div
      layoutId={layoutId}
      className="pointer-events-none absolute inset-0 -z-10 rounded-md bg-sidebar-accent group-data-[collapsible=icon]/sidebar-wrapper:hidden"
      transition={springs.snappy}
      aria-hidden
    />
  );
}

export { useNavMenuGroup };
