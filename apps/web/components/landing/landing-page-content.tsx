"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@areeza/ui/icons";
import { Badge } from "@areeza/ui/components/badge";
import { Button } from "@areeza/ui/components/button";
import { MetricCard } from "@areeza/ui/components/metric-card";
import { springTransition } from "@areeza/ui/motion/presets";
import { cn } from "@areeza/ui/lib/utils";
import { DEMO_CASE_ID } from "@areeza/core/api";
import { COMPLIANCE_NOTE } from "@/lib/copy";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const PROOF_STATS = [
  {
    label: "Yillik fuqarolik ishlar",
    value: "2M+",
    hint: "O'zbekiston sudlarida, +50% o'sish",
    icon: "scale" as const,
  },
  {
    label: "Protsessual tuzilma",
    value: "MKPK 189",
    hint: "Da'vo arizasi shabloni bo'yicha",
    icon: "file" as const,
  },
  {
    label: "Tekshiruv qadamlari",
    value: "12+",
    hint: "Qaytarish xavfini kamaytirish uchun",
    icon: "fileCheck" as const,
  },
  {
    label: "Maslahat",
    value: "Oliy sud",
    hint: "IT muhandislari bilan ishlab chiqilgan",
    icon: "shield" as const,
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Tasvirlang",
    body: "Oddiy tilda yozing — Areeza bir vaqtning o'zida bitta savol beradi va faktlarni yig'adi.",
    icon: "user" as const,
  },
  {
    step: "02",
    title: "Tayyorlang",
    body: "To'g'ri sud, ariza turi va MKPK 189 bo'yicha tuzilgan da'vo arizasi — shablon + faktlar.",
    icon: "file" as const,
  },
  {
    step: "03",
    title: "Tekshiring",
    body: "Majburiy maydonlar, davlat boji, muddat va yurisdiksiya bo'yicha avtomatik tekshiruv.",
    icon: "fileCheck" as const,
  },
  {
    step: "04",
    title: "Yuklab oling",
    body: "Sud formatidagi PDF paketini yuklab oling va e-sud bo'yicha qadam-baqadam yo'riqnoma.",
    icon: "download" as const,
  },
] as const;

function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-medium tracking-widest text-[var(--accent-gold)] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--navy)] text-[var(--primary-foreground)] shadow-[var(--fx-shadow-sm)]">
            <Icon name="scale" size="sm" />
          </span>
          <span className="font-semibold tracking-tight text-[var(--foreground)]">Areeza</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/cases">
            <Button variant="ghost" size="sm">
              Kirish
            </Button>
          </Link>
          <Link href="/cases/new?demo=1">
            <Button size="sm" className="gap-1.5">
              Demoni ko&apos;rish
              <Icon name="arrowRight" size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ reducedMotion }: { reducedMotion: boolean | null }) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;

  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklab,var(--scan-blue)_18%,transparent),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklab,var(--scan-blue)_12%,transparent),transparent)]"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative mx-auto max-w-6xl"
      >
        <motion.div variants={fadeUp} transition={transition}>
          <Badge
            variant="outline"
            shape="pill"
            className="mb-5 gap-2 border-[color-mix(in_oklab,var(--accent-gold)_35%,var(--border))] bg-[color-mix(in_oklab,var(--accent-gold)_8%,var(--card))] px-3 py-1 text-[var(--foreground)]"
          >
            <Icon name="shield" size={14} className="text-[var(--accent-gold)]" />
            Oliy sud maslahatchilari bilan ishlab chiqilgan
          </Badge>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={transition}
          className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
        >
          Hayotiy muammodan — sud uchun tayyor{" "}
          <span className="text-[var(--scan-blue-deep)] dark:text-[var(--scan-blue)]">
            da&apos;vo arizasigacha
          </span>
          .
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={transition}
          className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg"
        >
          Ko&apos;pchilik e-sud portallaridagi shakllar va yuridik atamalar oldida to&apos;xtab
          qoladi yoki arizasi qaytariladi. Areeza muammoingizni to&apos;g&apos;ri protsessual
          yo&apos;lga soladi, hujjatni tayyorlaydi va topshirishdan oldin tekshiradi.
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={transition}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        >
          <Link href="/cases/new?demo=1" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              <Icon name="sparkles" size="sm" />
              Demoni ko&apos;rish — to&apos;lanmagan ish haqi
            </Button>
          </Link>
          <Link href={`/cases/${DEMO_CASE_ID}`} className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Tayyor ishni ochish
            </Button>
          </Link>
        </motion.div>

        <motion.ul
          variants={fadeUp}
          transition={transition}
          className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--muted-foreground)] sm:text-sm"
        >
          {[
            "Yuridik maslahat emas — tayyorlash vositasi",
            "MKPK 189 bo'yicha tuzilma",
            "Inson nazoratida topshirish",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Icon name="check" size={14} className="text-[var(--accent-gold)]" />
              {item}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}

function TransformationSection({ reducedMotion }: { reducedMotion: boolean | null }) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;

  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface-2)] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="O'zgarish"
          title="Chalkash gapdan — sud hujjatigacha"
          description="Areeza fuqaroning oddiy tili va sud talab qiladigan protsessual format o'rtasidagi bo'shliqni yopadi."
          className="mb-10 sm:mb-14"
        />

        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: reducedMotion ? 0 : -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={transition}
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--fx-shadow-card)] sm:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--warn)_12%,transparent)] text-[var(--warn)]">
                <Icon name="alert" size="sm" />
              </span>
              <span className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
                Oldin
              </span>
            </div>
            <div className="space-y-3 rounded-lg bg-[var(--surface-3)] p-4">
              <p className="text-sm leading-relaxed text-[var(--foreground)]">
                &laquo;Ish beruvchi 4 oy ish haqini bermadi. Qayerga murojaat qilishni bilmayman.
                e-sudda qaysi shaklni tanlash kerak?&raquo;
              </p>
              <div className="flex flex-wrap gap-2">
                {["Qaysi sud?", "Noto'g'ri shakl", "Qaytarilgan ariza"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-[color-mix(in_oklab,var(--warn)_25%,var(--border))] bg-[color-mix(in_oklab,var(--warn)_8%,transparent)] px-2 py-0.5 text-xs text-[var(--warn)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={transition}
            className="flex items-center justify-center py-2 lg:py-0"
            aria-hidden
          >
            <span className="flex size-11 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--accent-gold)_40%,var(--border))] bg-[color-mix(in_oklab,var(--accent-gold)_10%,var(--card))] text-[var(--accent-gold)] shadow-[var(--fx-shadow-sm)]">
              <Icon name="arrowRight" size="lg" className="lg:rotate-0 rotate-90" />
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reducedMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={transition}
            className="flex flex-col rounded-xl border border-[color-mix(in_oklab,var(--scan-blue)_25%,var(--border))] bg-[var(--card)] p-5 shadow-[var(--fx-shadow-card)] sm:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--success)_12%,transparent)] text-[var(--success)]">
                <Icon name="check" size="sm" />
              </span>
              <span className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
                Keyin
              </span>
            </div>
            <div className="legal-paper flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-[0.8125rem] leading-relaxed">
              <p className="text-center text-[0.7rem] font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
                Andijon viloyati, Andijon shahar fuqarolik sudi
              </p>
              <p className="mt-3 text-center text-sm font-bold">DA&apos;VO ARIZASI</p>
              <p className="mt-1 text-center text-[0.7rem] text-[var(--muted-foreground)]">
                mehnat munosabatlari bo&apos;yicha
              </p>
              <div className="mt-4 space-y-1.5 text-[0.75rem]">
                <p>
                  <span className="font-semibold">Da&apos;vogar:</span> Aliyev A.A.
                </p>
                <p>
                  <span className="font-semibold">Javobgar:</span> &laquo;Oltin tex&raquo; MChJ
                </p>
                <p>
                  <span className="font-semibold">Da&apos;vo bahosi:</span> 12 800 000 so&apos;m
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-[var(--success)]">
                <Icon name="fileCheck" size={12} />
                MKPK 189 · tekshirilgan
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatsSection({ reducedMotion }: { reducedMotion: boolean | null }) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Dalillar"
          title="Raqamlar va ishonch"
          description="Sud tizimi o'smoqda — fuqarolar uchun tayyorlash qatlami hali yetishmaydi."
          className="mb-10 sm:mb-12"
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PROOF_STATS.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} transition={transition}>
              <MetricCard
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                icon={<Icon name={stat.icon} size="md" />}
                className="h-full"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection({ reducedMotion }: { reducedMotion: boolean | null }) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;

  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Jarayon"
          title="Qanday ishlaydi"
          description="To'rt qadam: tasvirlang, tayyorlang, tekshiring, yuklab oling."
          className="mb-10 sm:mb-12"
        />

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {HOW_IT_WORKS.map((item, index) => (
            <motion.li
              key={item.title}
              variants={fadeUp}
              transition={transition}
              className="relative list-none rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--fx-shadow-sm)]"
            >
              {index < HOW_IT_WORKS.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-1/2 -right-2 hidden size-4 -translate-y-1/2 text-[var(--accent-gold)] lg:block"
                >
                  <Icon name="arrowRight" size={16} />
                </span>
              ) : null}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold tabular-nums tracking-widest text-[var(--accent-gold)]">
                  {item.step}
                </span>
                <span className="flex size-9 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--scan-blue)_10%,transparent)] text-[var(--scan-blue-deep)] dark:text-[var(--scan-blue)]">
                  <Icon name={item.icon} size="md" />
                </span>
              </div>
              <h3 className="font-semibold text-[var(--foreground)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {item.body}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

function ComingSoonSection({ reducedMotion }: { reducedMotion: boolean | null }) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={transition}
        className="mx-auto max-w-6xl rounded-2xl border border-[color-mix(in_oklab,var(--scan-blue)_20%,var(--border))] bg-[color-mix(in_oklab,var(--navy)_6%,var(--card))] p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-3">
            <Badge
              variant="secondary"
              shape="pill"
              className="gap-1.5 border-[color-mix(in_oklab,var(--accent-gold)_30%,var(--border))] text-[var(--accent-gold)]"
            >
              <Icon name="sparkles" size={12} />
              Tez orada
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
              To&apos;g&apos;ridan-to&apos;g&apos;ri e-sud orqali topshirish
            </h2>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              Hozircha Areeza sudga tayyor PDF paketini tayyorlaydi va my.sud.uz bo&apos;yicha
              yo&apos;riqnoma beradi. Keyingi bosqichda arizani to&apos;g&apos;ridan-to&apos;g&apos;ri
              sud kabinetiga yuborish rejalashtirilgan.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-3)] px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--scan-blue)_12%,transparent)] text-[var(--scan-blue)]">
              <Icon name="externalLink" size="md" />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">my.sud.uz</p>
              <p className="text-xs text-[var(--muted-foreground)]">Elektron sud kabineti</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function CtaSection({ reducedMotion }: { reducedMotion: boolean | null }) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;

  return (
    <section className="border-t border-[var(--border)] px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={transition}
        className="mx-auto max-w-6xl text-center"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Birinchi arizangizni tayyorlang
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
          To&apos;lanmagan ish haqi bo&apos;yicha demo ishni oching — intake dan PDF eksportgacha
          butun jarayonni ko&apos;ring.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/cases/new?demo=1" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              <Icon name="sparkles" size="sm" />
              Demoni boshlash
            </Button>
          </Link>
          <Link href="/cases" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Mening ishlarim
            </Button>
          </Link>
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">
          {COMPLIANCE_NOTE}
        </p>
      </motion.div>
    </section>
  );
}

export function LandingPageContent() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <LandingHeader />
      <main>
        <HeroSection reducedMotion={reducedMotion} />
        <TransformationSection reducedMotion={reducedMotion} />
        <StatsSection reducedMotion={reducedMotion} />
        <HowItWorksSection reducedMotion={reducedMotion} />
        <ComingSoonSection reducedMotion={reducedMotion} />
        <CtaSection reducedMotion={reducedMotion} />
      </main>
    </div>
  );
}
