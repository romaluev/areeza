"use client";

import { SegmentError } from "@/components/shell/segment-error";

export default function NewCaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      error={error}
      reset={reset}
      title="Murojaat boshlanmadi"
      description="Qayta urinib ko'ring — kiritilgan matn saqlangan bo'lishi mumkin."
    />
  );
}
