"use client";

import { toast } from "sonner";

export function showRetryToast(
  message: string,
  onRetry: () => void | Promise<void>,
  description?: string,
) {
  toast.error(message, {
    description,
    duration: 8000,
    action: {
      label: "Qayta urinish",
      onClick: () => {
        void onRetry();
      },
    },
  });
}
