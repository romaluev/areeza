"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../lib/utils";
import { Elevated, SurfaceProvider } from "../lib/surface-context";
import { OverlayContentMotion } from "../lib/overlay-content";

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root delayDuration={200} {...props} />;
}

export function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger {...props} />;
}

export function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content sideOffset={sideOffset} asChild {...props}>
        <OverlayContentMotion preset="snappy" className="z-50 outline-none">
          <SurfaceProvider level={7}>
            <Elevated
              offset={0}
              className={cn(
                "max-w-xs rounded-lg px-3 py-1.5 text-xs text-[var(--popover-foreground)]",
                className,
              )}
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              {children}
            </Elevated>
          </SurfaceProvider>
        </OverlayContentMotion>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
