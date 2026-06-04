"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { useShapeRadius } from "../lib/shape-context";
import { fontWeightTransition } from "../lib/font-weight";

const buttonVariants = cva(
  cn(
    "group relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm",
    fontWeightTransition,
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        primary: "text-[var(--primary-foreground)]",
        default: "text-[var(--primary-foreground)]",
        brand: "text-[var(--primary-foreground)]",
        secondary: "text-[var(--foreground)]",
        tertiary: "text-[var(--foreground)]",
        outline: "text-[var(--foreground)]",
        ghost: "text-[var(--foreground)]",
        destructive: "text-white",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        default: "h-8 px-4",
        md: "h-8 px-4",
        lg: "h-10 px-6 text-base [&_svg]:size-5",
        icon: "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

const buttonBgVariants = cva(
  "absolute inset-0 -z-10 transition-[opacity,transform,background-color] duration-[var(--dur-fast)] ease-[var(--ease-std)] motion-reduce:transition-none",
  {
    variants: {
      variant: {
        primary: "bg-[var(--primary)] group-hover:opacity-90 group-active:opacity-80",
        default: "bg-[var(--primary)] group-hover:opacity-90 group-active:opacity-80",
        brand: "bg-[var(--primary)] group-hover:opacity-90 group-active:opacity-80",
        secondary:
          "border border-[var(--border)] bg-[var(--secondary)] group-hover:opacity-90 group-active:opacity-80",
        tertiary:
          "border border-[var(--border)] bg-transparent group-hover:bg-[var(--surface-3)] group-active:bg-[var(--surface-4)]",
        outline:
          "border border-[var(--border)] bg-transparent group-hover:bg-[var(--surface-3)] group-active:bg-[var(--surface-4)]",
        ghost:
          "bg-transparent group-hover:bg-[var(--surface-3)] group-active:bg-[var(--surface-4)]",
        destructive:
          "bg-[var(--destructive)] group-hover:opacity-90 group-active:opacity-80",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

function resolveVariant(
  variant: VariantProps<typeof buttonVariants>["variant"],
): NonNullable<VariantProps<typeof buttonVariants>["variant"]> {
  if (variant === "default") return "primary";
  if (variant === "outline") return "tertiary";
  return variant ?? "primary";
}

function ButtonSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 animate-spinner-move", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle
        className="animate-spinner-dash opacity-90"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const resolved = resolveVariant(variant);
  const radius = useShapeRadius();
  const Comp = asChild ? Slot : "button";
  const isDisabled = disabled || loading;

  return (
    <Comp
      data-slot="button"
      data-variant={resolved}
      className={cn(buttonVariants({ variant: resolved, size, className }))}
      style={{ borderRadius: radius, ...style }}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      <span
        aria-hidden
        className={cn(buttonBgVariants({ variant: resolved }))}
        style={{ borderRadius: radius }}
      />
      {loading ? (
        <>
          <ButtonSpinner />
          <span className="sr-only">Yuklanmoqda</span>
        </>
      ) : null}
      <span
        className={cn(
          "relative inline-flex items-center justify-center gap-2",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>
    </Comp>
  );
}

export { buttonVariants, ButtonSpinner };
