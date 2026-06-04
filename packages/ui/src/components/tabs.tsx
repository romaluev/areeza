"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { LayoutGroup, motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useProximityHover } from "../hooks/use-proximity-hover";
import { useMotionTransition, useReducedMotion } from "../hooks/use-reduced-motion";
import { interactiveWeight } from "../lib/font-weight";
import { reducedMotionClass } from "../motion/presets";

const focusRing =
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

const TabsValueContext = React.createContext<string>("");

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const resolved = value ?? internal;

  const handleChange = React.useCallback(
    (next: string) => {
      onValueChange?.(next);
      if (value === undefined) setInternal(next);
    },
    [onValueChange, value],
  );

  return (
    <TabsValueContext.Provider value={resolved}>
      <TabsPrimitive.Root value={resolved} onValueChange={handleChange} {...props} />
    </TabsValueContext.Provider>
  );
}

export function TabsList({
  className,
  layoutId = "areeza-tab-pill",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { layoutId?: string }) {
  const listRef = React.useRef<HTMLDivElement>(null);
  useProximityHover(listRef, { axis: "x" });

  return (
    <LayoutGroup id={layoutId}>
      <TabsPrimitive.List
        ref={listRef}
        data-slot="tabs-list"
        className={cn(
          "relative inline-flex h-8 items-center gap-0.5 rounded-lg bg-surface-3 p-[length:var(--control-track-padding)] text-muted-foreground",
          reducedMotionClass,
          className,
        )}
        {...props}
      />
    </LayoutGroup>
  );
}

export function TabsTrigger({
  className,
  children,
  value,
  layoutId = "areeza-tab-pill",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { layoutId?: string }) {
  const activeValue = React.useContext(TabsValueContext);
  const isActive = activeValue === value;
  const transition = useMotionTransition("moderate");
  const reducedMotion = useReducedMotion();

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-proximity-id={value}
      value={value}
      className={cn(
        "relative z-10 inline-flex h-[calc(var(--control-h)-var(--control-track-padding)*2)] flex-1 items-center justify-center whitespace-nowrap rounded-pill px-3 text-sm",
        interactiveWeight,
        "text-muted-foreground transition-[color] duration-[var(--dur-fast)]",
        focusRing,
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-foreground",
        "data-[proximity]:text-foreground",
        className,
      )}
      {...props}
    >
      {isActive && !reducedMotion ? (
        <motion.span
          layoutId={layoutId}
          transition={transition}
          className="absolute inset-0 rounded-pill bg-card shadow-surface-2"
          aria-hidden
        />
      ) : isActive ? (
        <span
          className="absolute inset-0 rounded-pill bg-card shadow-surface-2"
          aria-hidden
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-3 focus-visible:outline-none", className)}
      {...props}
    />
  );
}
