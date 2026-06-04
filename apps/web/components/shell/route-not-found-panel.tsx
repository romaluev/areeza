import Link from "next/link";
import { Button } from "@areeza/ui/components/button";
import { EmptyState } from "@areeza/ui/components/empty-state";
import { uiCopy, type AppLocale } from "@/lib/copy";

export function RouteNotFoundPanel({ locale = "uz" }: { locale?: AppLocale }) {
  const copy = uiCopy(locale);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12">
      <EmptyState
        icon="folder"
        variant="page"
        title={copy.notFoundTitle}
        description={copy.notFoundDescription}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild variant="brand">
              <Link href="/situations/new">{copy.newSituationCta}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/situations">{copy.homeLink}</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
