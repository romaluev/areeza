import Link from "next/link";
import { Icon } from "@areeza/ui/icons";
import { Button } from "@areeza/ui/components/button";
import { DEMO_CASE_ID } from "@areeza/core/api";
import { COMPLIANCE_NOTE } from "@/lib/copy";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Icon name="scale" size="sm" />
            </span>
            <span className="font-semibold tracking-tight">Areeza</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cases">
              <Button variant="ghost" size="sm">
                Kirish
              </Button>
            </Link>
            <Link href={`/cases/new?demo=1`}>
              <Button size="sm" className="gap-1.5">
                Demoni ko&apos;rish
                <Icon name="arrowRight" size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
          <Icon name="shield" size={14} className="text-[var(--accent-gold)]" />
          Oliy sud maslahatchilari bilan ishlab chiqilgan
        </div>

        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Hayotiy muammodan — sud uchun tayyor{" "}
          <span className="text-[var(--primary)]">da&apos;vo arizasigacha</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)]">
          Ko&apos;pchilik e-sud portallaridagi shakllar va yuridik atamalar oldida to&apos;xtab
          qoladi yoki arizasi qaytariladi. Areeza muammoingizni to&apos;g&apos;ri protsessual
          yo&apos;lga soladi, hujjatni tayyorlaydi va topshirishdan oldin tekshiradi.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/cases/new?demo=1`}>
            <Button size="lg" className="gap-2">
              <Icon name="sparkles" size="sm" />
              Demoni ko&apos;rish — to&apos;lanmagan ish haqi
            </Button>
          </Link>
          <Link href={`/cases/${DEMO_CASE_ID}`}>
            <Button size="lg" variant="outline">
              Tayyor ishni ochish
            </Button>
          </Link>
        </div>

        <section className="mt-20 grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Tasvirlang",
              body: "Oddiy tilda yozing — Areeza bir vaqtning o'zida bitta savol beradi va faktlarni yig'adi.",
            },
            {
              title: "Tayyorlang",
              body: "To'g'ri sud, ariza turi va CPC 189 bo'yicha tuzilgan da'vo arizasi — shablon + faktlar.",
            },
            {
              title: "Tekshiring",
              body: "Qaytarish xavfini kamaytiruvchi tekshiruv ro'yxati va e-sud bo'yicha yo'riqnoma.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 areeza-rise"
            >
              <h3 className="font-semibold text-[var(--primary)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <p className="mt-16 text-center text-xs text-[var(--muted-foreground)]">
          {COMPLIANCE_NOTE}
        </p>
      </main>
    </div>
  );
}
