"use client";

import { SegmentError } from "@/components/shell/segment-error";

export default function MarketingError({
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
      title="Sahifa yuklanmadi"
      description="Bosh sahifaga qayting yoki qayta urinib ko'ring."
    />
  );
}
