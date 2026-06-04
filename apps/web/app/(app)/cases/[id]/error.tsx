"use client";

import { SegmentError } from "@/components/shell/segment-error";

export default function CaseDetailError({
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
      title="Ish sahifasi yuklanmadi"
      description="Ushbu ishni ochib bo'lmadi. Ro'yxatdan boshqa ishni tanlang."
    />
  );
}
