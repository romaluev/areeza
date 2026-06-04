import Link from "next/link";
import { Button } from "@areeza/ui/components/button";
import { EmptyState } from "@areeza/ui/components/empty-state";

export default function CaseNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12">
      <EmptyState
        icon="folder"
        title="Ish topilmadi"
        description="Bu havola eskirgan yoki ish o'chirilgan bo'lishi mumkin. Yangi murojaat boshlang yoki ishlar ro'yxatiga qayting."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link href="/cases/new">Yangi ish boshlash</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cases">Ishlarim</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
