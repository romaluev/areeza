"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@areeza/ui/components/button";
import { cn } from "@areeza/ui/lib/utils";

type BaseProps = ComponentProps<typeof Button>;

interface ComposerIconButtonProps extends Omit<BaseProps, "size" | "variant" | "children"> {
  icon: ReactNode;
  tone?: "ghost" | "filled" | "danger" | "recording";
  "aria-label": string;
}

export function ComposerIconButton({
  icon,
  tone = "ghost",
  className,
  disabled,
  ...rest
}: ComposerIconButtonProps) {
  const toneClasses: Record<NonNullable<ComposerIconButtonProps["tone"]>, string> = {
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
    filled: "bg-foreground text-background hover:bg-foreground/90 active:scale-95",
    danger: "text-destructive hover:bg-destructive/10",
    recording:
      "bg-destructive/10 text-destructive ring-2 ring-destructive/30 motion-safe:animate-pulse",
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      className={cn(
        "rounded-full transition-[background-color,opacity,transform] duration-200",
        toneClasses[tone],
        disabled && tone !== "filled" && "opacity-60",
        className,
      )}
      {...rest}
    >
      {icon}
    </Button>
  );
}
