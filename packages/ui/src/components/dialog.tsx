"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { Elevated, SurfaceProvider } from "../lib/surface-context";
import { OverlayContentMotion } from "../lib/overlay-content";
import { useMotionTransition } from "../hooks/use-reduced-motion";
import { Icon } from "../icons";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export function DialogOverlay({
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

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { showClose?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content asChild {...props}>
        <OverlayContentMotion
          preset="soft"
          className={cn(
            "fixed top-[50%] left-[50%] z-50 w-full max-w-[length:var(--layout-dialog-width)] translate-x-[-50%] translate-y-[-50%] p-0 focus:outline-none",
            className,
          )}
        >
          <SurfaceProvider level={6}>
            <Elevated
              offset={0}
              className="relative rounded-xl p-6"
              style={{ borderRadius: "var(--radius-xl)" }}
            >
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
        </OverlayContentMotion>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function DialogTitle({
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

export function DialogDescription({
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
