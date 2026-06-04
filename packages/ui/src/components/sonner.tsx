"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Icon } from "../icons";

export function Toaster({ theme = "system", ...props }: ToasterProps) {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-xl !border !border-[var(--border)] !bg-[var(--popover)] !text-[var(--popover-foreground)] !shadow-surface-5 !font-sans",
          title: "!text-sm !font-medium",
          description: "!text-sm !text-[var(--muted-foreground)]",
          actionButton:
            "!rounded-lg !bg-[var(--primary)] !text-[var(--primary-foreground)] !text-xs",
          cancelButton:
            "!rounded-lg !border !border-[var(--border)] !bg-transparent !text-xs",
          success: "!border-[color-mix(in_oklab,var(--success)_25%,var(--border))]",
          error: "!border-[color-mix(in_oklab,var(--danger)_25%,var(--border))]",
          warning: "!border-[color-mix(in_oklab,var(--warn)_25%,var(--border))]",
        },
      }}
      icons={{
        success: <Icon name="check" size="sm" className="text-[var(--success)]" />,
        error: <Icon name="alert" size="sm" className="text-[var(--danger)]" />,
        warning: <Icon name="alertWarn" size="sm" className="text-[var(--warn)]" />,
        info: <Icon name="sparkles" size="sm" className="text-[var(--primary)]" />,
      }}
      closeButton
      duration={4000}
      {...props}
    />
  );
}

export { toast } from "sonner";
