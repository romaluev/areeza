"use client";

import { SegmentError } from "@/components/shell/segment-error";

export default function CasesError({
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
      title="Ishlar ro'yxati yuklanmadi"
      description="Internet yoki vaqtinchalik muammo bo'lishi mumkin."
    />
  );
}
