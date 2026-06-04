"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../lib/utils";
import { Elevated, SurfaceProvider } from "../lib/surface-context";
import { OverlayContentMotion } from "../lib/overlay-content";
import { useProximityHover } from "../hooks/use-proximity-hover";
import { interactiveWeight } from "../lib/font-weight";
import { Icon } from "../icons";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm shadow-xs",
        "transition-[color,box-shadow,border-color] duration-[var(--dur-fast)]",
        "focus-visible:border-[var(--ring)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>span]:line-clamp-1",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <Icon name="arrowUp" size="sm" className="rotate-180 opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  useProximityHover(listRef, { axis: "y" });

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content position={position} asChild {...props}>
        <OverlayContentMotion preset="gentle" className="z-50 outline-none">
          <SurfaceProvider level={7}>
            <Elevated
              offset={0}
              className={cn(
                "max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl p-1",
                className,
              )}
              style={{ borderRadius: "var(--radius-xl)" }}
            >
              <div ref={listRef}>
                <SelectPrimitive.Viewport
                  className={cn(
                    "p-0.5",
                    position === "popper" &&
                      "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
                  )}
                >
                  {children}
                </SelectPrimitive.Viewport>
              </div>
            </Elevated>
          </SurfaceProvider>
        </OverlayContentMotion>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn("px-2 py-1.5 text-xs text-[var(--muted-foreground)]", className)}
      {...props}
    />
  );
}

export function SelectItem({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const itemId = value ?? React.useId();

  return (
    <SelectPrimitive.Item
      value={value}
      data-proximity-id={itemId}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg py-1.5 pr-8 pl-2 text-sm outline-none",
        interactiveWeight,
        "focus:bg-[var(--surface-4)] data-[highlighted]:bg-[var(--surface-4)]",
        "data-[proximity]:bg-[var(--surface-3)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icon name="check" size="xs" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-[var(--border)]", className)}
      {...props}
    />
  );
}
