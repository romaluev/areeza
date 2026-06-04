"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@areeza/ui/components/button";
import { EmptyState } from "@areeza/ui/components/empty-state";
import { uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";

export function RouteErrorPanel({
  error,
  reset,
  title,
  description,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  const { locale } = useAppLocale();
  const copy = uiCopy(locale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-12">
      <EmptyState
        icon="alert"
        variant="page"
        title={title ?? copy.segmentErrorTitle}
        description={description ?? copy.segmentErrorDescription}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="brand" onClick={() => reset()}>
              {copy.retry}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/situations">{copy.homeLink}</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
