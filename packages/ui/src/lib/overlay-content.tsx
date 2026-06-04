"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useMotionTransition } from "../hooks/use-reduced-motion";
import { cn } from "./utils";

export interface OverlayContentMotionProps extends HTMLMotionProps<"div"> {
  /** Initial scale before spring open (craft: 0.97 → 1). */
  fromScale?: number;
  preset?: "soft" | "gentle" | "snappy";
}

/** Spring scale + opacity for Radix overlays (dialog, sheet, menu, tooltip). */
export function OverlayContentMotion({
  className,
  fromScale = 0.97,
  preset = "soft",
  children,
  ...props
}: OverlayContentMotionProps) {
  const transition = useMotionTransition(preset);

  return (
    <motion.div
      initial={{ opacity: 0, scale: fromScale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: fromScale }}
      transition={transition}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
