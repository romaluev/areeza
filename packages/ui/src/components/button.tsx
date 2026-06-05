"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Icon } from "../icons";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,transform] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        brand: "bg-brand text-brand-foreground shadow-sm hover:bg-brand/90",
        "brand-outline":
          "border-brand/40 bg-background text-brand hover:border-brand/60 hover:bg-brand/8 hover:text-brand dark:bg-input/30 dark:hover:bg-brand/12",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-3",
        icon: "size-8",
        "icon-sm": "size-7",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-9",
      },
    },
    compoundVariants: [{ variant: "brand-outline", class: "rounded-lg" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/** @deprecated Use `default` or `brand` — kept for call-site compatibility. */
const legacyVariantMap = {
  primary: "default",
  tertiary: "outline",
} as const;

/** @deprecated Use `default` — kept for call-site compatibility. */
const legacySizeMap = {
  md: "default",
} as const;

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

function resolveVariant(
  variant: ButtonProps["variant"],
): ButtonVariant {
  if (variant == null) return "default";
  if (variant in legacyVariantMap) {
    return legacyVariantMap[variant as LegacyButtonVariant];
  }
  return variant as ButtonVariant;
}

function resolveSize(size: ButtonProps["size"]): ButtonSize {
  if (size == null) return "default";
  if (size in legacySizeMap) {
    return legacySizeMap[size as LegacyButtonSize];
  }
  return size as ButtonSize;
}

type LegacyButtonVariant = "primary" | "tertiary";
type LegacyButtonSize = "md";

/** FF icon component shape: a leading/trailing glyph that accepts a numeric size. */
export type ButtonIconComponent = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "variant" | "size"> {
  variant?: VariantProps<typeof buttonVariants>["variant"] | LegacyButtonVariant;
  size?: VariantProps<typeof buttonVariants>["size"] | LegacyButtonSize;
  asChild?: boolean;
  loading?: boolean;
  /** FF Button API parity — icon rendered before the label. */
  leadingIcon?: ButtonIconComponent;
  /** FF Button API parity — icon rendered after the label. */
  trailingIcon?: ButtonIconComponent;
}

function iconPixels(size: ButtonSize): number {
  if (size === "xs" || size === "icon-xs") return 12;
  if (size === "sm" || size === "icon-sm") return 14;
  if (size === "lg" || size === "icon-lg") return 20;
  return 16;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  children,
  ...props
}: ButtonProps) {
  const resolvedVariant = resolveVariant(variant);
  const resolvedSize = resolveSize(size);
  const Comp = asChild ? Slot : "button";
  const spinnerClass =
    resolvedSize === "xs" || resolvedSize === "icon-xs"
      ? "size-3"
      : resolvedSize === "sm" || resolvedSize === "icon-sm"
        ? "size-3.5"
        : "size-4";
  const iconSize = iconPixels(resolvedSize);
  const hasFlankingIcons = !asChild && !loading && (LeadingIcon || TrailingIcon);

  return (
    <Comp
      data-slot="button"
      data-variant={resolvedVariant}
      className={cn(
        buttonVariants({ variant: resolvedVariant, size: resolvedSize, className }),
        loading && "cursor-wait",
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Icon name="loading" className={cn("animate-spin", spinnerClass)} aria-hidden />
          {asChild ? null : children}
        </>
      ) : hasFlankingIcons ? (
        <>
          {LeadingIcon ? <LeadingIcon size={iconSize} strokeWidth={2} aria-hidden /> : null}
          {children}
          {TrailingIcon ? <TrailingIcon size={iconSize} strokeWidth={2} aria-hidden /> : null}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

function ButtonSpinner({ className }: { className?: string }) {
  return <Icon name="loading" className={cn("animate-spin", className)} aria-hidden />;
}

export { buttonVariants, ButtonSpinner };
