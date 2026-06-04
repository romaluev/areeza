"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/utils";
import { Elevated, SurfaceProvider } from "../lib/surface-context";
import { OverlayContentMotion } from "../lib/overlay-content";
import { useProximityHover } from "../hooks/use-proximity-hover";
import { interactiveWeight } from "../lib/font-weight";
import { Icon } from "../icons";

const focusRing =
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export function DropdownMenuContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  useProximityHover(listRef, { axis: "y" });

  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content sideOffset={sideOffset} asChild {...props}>
        <OverlayContentMotion preset="gentle" className="z-50 outline-none">
          <SurfaceProvider level={7}>
            <Elevated
              offset={0}
              className={cn(
                "min-w-[8rem] overflow-hidden rounded-xl p-1 text-popover-foreground",
                "max-w-[length:var(--layout-popover-width)]",
                className,
              )}
              style={{ borderRadius: "var(--radius-xl)" }}
            >
              <div ref={listRef} className="flex flex-col gap-0.5 p-0.5">
                {children}
              </div>
            </Elevated>
          </SurfaceProvider>
        </OverlayContentMotion>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPortal>
  );
}

export function DropdownMenuItem({
  className,
  inset,
  id,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  id?: string;
}) {
  const itemId = id ?? React.useId();

  return (
    <DropdownMenuPrimitive.Item
      data-proximity-id={itemId}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none",
        interactiveWeight,
        "text-foreground transition-[background-color,color] duration-[var(--dur-fast)]",
        "focus:bg-surface-4 data-[highlighted]:bg-surface-4",
        "data-[proximity]:bg-surface-3 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        focusRing,
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  const itemId = React.useId();

  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-proximity-id={itemId}
      checked={checked}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-1.5 pr-2 pl-8 text-sm outline-none",
        interactiveWeight,
        "focus:bg-surface-4 data-[highlighted]:bg-surface-4 data-[proximity]:bg-surface-3",
        focusRing,
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Icon name="check" size="xs" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-muted-foreground",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
}
