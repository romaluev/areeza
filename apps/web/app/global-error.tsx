"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@areeza/ui/components/button";
import { uiCopy } from "@/lib/copy";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const copy = uiCopy("uz");

  return (
    <html lang="uz">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <h1 className="text-xl font-semibold">{copy.globalErrorTitle}</h1>
          <p className="max-w-md text-sm text-muted-foreground">{copy.globalErrorDescription}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="brand" onClick={() => reset()}>
              {copy.retry}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/situations">{copy.homeLink}</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
