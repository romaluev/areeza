"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, type TargetAndTransition } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Elevated, SurfaceProvider } from "../lib/surface-context";
import { useMotionTransition } from "../hooks/use-reduced-motion";
import { Icon } from "../icons";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

const sheetVariants = cva("fixed z-50 flex flex-col gap-4 bg-transparent p-0 shadow-none", {
  variants: {
    side: {
      top: "inset-x-0 top-0 border-b",
      bottom: "inset-x-0 bottom-0 border-t",
      left: "inset-y-0 left-0 h-full w-[min(100%,20rem)] border-r",
      right: "inset-y-0 right-0 h-full w-[min(100%,var(--layout-app-sidebar-width))] border-l",
    },
  },
  defaultVariants: { side: "right" },
});

const sheetMotion: Record<
  NonNullable<VariantProps<typeof sheetVariants>["side"]>,
  { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }
> = {
  top: { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } },
  bottom: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
  left: { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" } },
  right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
};

export function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const transition = useMotionTransition("gentle");

  return (
    <DialogPrimitive.Overlay asChild {...props}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        className={cn(
          "fixed inset-0 z-50 bg-[var(--overlay-scrim)] backdrop-blur-[2px]",
          className,
        )}
      />
    </DialogPrimitive.Overlay>
  );
}

export function SheetContent({
  className,
  children,
  side = "right",
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetVariants> & { showClose?: boolean }) {
  const transition = useMotionTransition("soft");
  const motionPreset = sheetMotion[side ?? "right"];

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content asChild {...props}>
        <motion.div
          initial={motionPreset.initial}
          animate={motionPreset.animate}
          exit={motionPreset.exit}
          transition={transition}
          className={cn(sheetVariants({ side }), className)}
        >
          <SurfaceProvider level={7}>
            <Elevated offset={0} className="relative flex h-full min-h-0 flex-col rounded-none p-6">
              {children}
              {showClose ? (
                <DialogPrimitive.Close
                  className="absolute top-4 right-4 rounded-md p-1 text-[var(--muted-foreground)] opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
                  aria-label="Yopish"
                >
                  <Icon name="cancel" size="sm" />
                </DialogPrimitive.Close>
              ) : null}
            </Elevated>
          </SurfaceProvider>
        </motion.div>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-auto flex flex-col gap-2 pt-4", className)} {...props} />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-[var(--muted-foreground)]", className)}
      {...props}
    />
  );
}
