"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@areeza/ui/components/button";

export function SegmentError({
  error,
  reset,
  title = "Nimadir noto'g'ri ketdi",
  description = "Sahifani yangilab ko'ring yoki bosh sahifaga qayting.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-lg font-semibold text-[var(--foreground)]">{title}</h1>
      <p className="max-w-md text-sm text-[var(--muted-foreground)]">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Qayta urinish
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/cases">Bosh sahifa</Link>
        </Button>
      </div>
    </div>
  );
}
