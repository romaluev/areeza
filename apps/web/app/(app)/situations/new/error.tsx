"use client";

import { RouteErrorPanel } from "@/components/shell/route-error-panel";

export default function NewSituationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorPanel error={error} reset={reset} />;
}
