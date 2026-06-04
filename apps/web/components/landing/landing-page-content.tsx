"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@areeza/ui/icons";
import { Badge } from "@areeza/ui/components/badge";
import { Button } from "@areeza/ui/components/button";
import { MetricCard } from "@areeza/ui/components/metric-card";
import { springTransition } from "@areeza/ui/motion/presets";
import { cn } from "@areeza/ui/lib/utils";
import {
  DEMO_SITUATION_ID,
  SCENARIO_A_ID,
  SCENARIO_B_ID,
  SCENARIO_C_ID,
} from "@areeza/core/api";
import { COMPLIANCE_NOTE, LANDING_COPY, type LandingCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import { LocaleToggle } from "@/components/shell/locale-toggle";

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

const SCENARIO_OPEN_HREFS = [
  `/situations/${SCENARIO_A_ID}`,
  `/situations/${SCENARIO_B_ID}`,
  `/situations/${SCENARIO_C_ID}`,
  `/situations/${DEMO_SITUATION_ID}`,
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
        <p className="mb-3 text-xs font-medium tracking-widest text-brand uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function LandingHeader({ copy }: { copy: LandingCopy }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-sm">
            <Icon name="scale" size="sm" />
          </span>
          <span className="font-semibold tracking-tight text-foreground">Areeza</span>
        </Link>
        <div className="flex items-center gap-2">
          <LocaleToggle className="hidden sm:flex" />
          <Link href="/situations">
            <Button variant="ghost" size="sm">
              {copy.signIn}
            </Button>
          </Link>
          <Link href={`/situations/${DEMO_SITUATION_ID}`}>
            <Button variant="brand" size="sm" className="gap-1.5">
              {copy.demoCta}
              <Icon name="arrowRight" size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection({
  reducedMotion,
  copy,
}: {
  reducedMotion: boolean | null;
  copy: LandingCopy;
}) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;

  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent)]"
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
            className="mb-5 gap-2 border-brand/35 bg-brand/5 px-3 py-1 text-foreground"
          >
            <Icon name="shield" size={14} className="text-brand" />
            {copy.heroBadge}
          </Badge>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={transition}
          className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
        >
          {copy.heroTitle}{" "}
          <span className="text-primary">{copy.heroTitleAccent}</span>.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={transition}
          className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          {copy.heroBody}
        </motion.p>

        <motion.div variants={fadeUp} transition={transition} className="mt-8">
          <Link href={`/situations/${DEMO_SITUATION_ID}`} className="inline-block w-full sm:w-auto">
            <Button variant="brand" size="lg" className="w-full gap-2 sm:w-auto">
              <Icon name="sparkles" size="sm" />
              {copy.demoCta}
            </Button>
          </Link>
        </motion.div>

        <motion.ul
          variants={fadeUp}
          transition={transition}
          className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm"
        >
          {[copy.trust1, copy.trust2, copy.trust3].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Icon name="check" size={14} className="text-brand" />
              {item}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}

function TransformationSection({
  reducedMotion,
  copy,
}: {
  reducedMotion: boolean | null;
  copy: LandingCopy;
}) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;
  const t = copy.transformation;

  return (
    <section className="border-y border-border bg-surface-2 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
          className="mb-10 sm:mb-14"
        />

        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: reducedMotion ? 0 : -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={transition}
            className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-warn/10 text-warn">
                <Icon name="alert" size="sm" />
              </span>
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t.beforeLabel}
              </span>
            </div>
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <p className="text-sm leading-relaxed text-foreground">{t.beforeQuote}</p>
              <div className="flex flex-wrap gap-2">
                {t.beforeTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-warn/25 bg-warn/10 px-2 py-0.5 text-xs text-warn"
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
            <span className="flex size-11 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-brand shadow-sm">
              <Icon name="arrowRight" size="lg" className="rotate-90 lg:rotate-0" />
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reducedMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={transition}
            className="flex flex-col rounded-xl border border-primary/25 bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-success/10 text-success">
                <Icon name="check" size="sm" />
              </span>
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t.afterLabel}
              </span>
            </div>
            <div className="legal-paper flex-1 rounded-lg border border-border bg-legal-paper p-4 text-[0.8125rem] leading-relaxed">
              <p className="text-center text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
                {t.courtName}
              </p>
              <p className="mt-3 text-center text-sm font-bold">{t.docTitle}</p>
              <p className="mt-1 text-center text-[0.7rem] text-muted-foreground">{t.docSubtitle}</p>
              <div className="mt-4 space-y-1.5 text-[0.75rem]">
                <p>{t.plaintiff}</p>
                <p>{t.defendant}</p>
                <p>{t.claimAmount}</p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-success">
                <Icon name="fileCheck" size={12} />
                {t.verified}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatsSection({
  reducedMotion,
  copy,
}: {
  reducedMotion: boolean | null;
  copy: LandingCopy;
}) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;
  const s = copy.stats;

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={s.eyebrow}
          title={s.title}
          description={s.description}
          className="mb-10 sm:mb-12"
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {s.items.map((stat) => (
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

function HowItWorksSection({
  reducedMotion,
  copy,
}: {
  reducedMotion: boolean | null;
  copy: LandingCopy;
}) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;
  const h = copy.howItWorks;

  return (
    <section className="border-t border-border bg-surface-2 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={h.eyebrow}
          title={h.title}
          description={h.description}
          className="mb-10 sm:mb-12"
        />

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {h.steps.map((item, index) => (
            <motion.li
              key={item.title}
              variants={fadeUp}
              transition={transition}
              className="relative list-none rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              {index < h.steps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-1/2 -right-2 hidden size-4 -translate-y-1/2 text-brand lg:block"
                >
                  <Icon name="arrowRight" size={16} />
                </span>
              ) : null}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold tabular-nums tracking-widest text-brand">
                  {item.step}
                </span>
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon name={item.icon} size="md" />
                </span>
              </div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

function ExampleScenariosSection({
  reducedMotion,
  copy,
}: {
  reducedMotion: boolean | null;
  copy: LandingCopy;
}) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;
  const sc = copy.scenarios;

  return (
    <section className="border-y border-border bg-surface-2 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={sc.eyebrow}
          title={sc.title}
          description={sc.description}
          className="mb-8"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {sc.items.map((s, index) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={transition}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={s.href}>
                  <Button size="sm">{sc.start}</Button>
                </Link>
                <Link href={SCENARIO_OPEN_HREFS[index] ?? `/situations/${DEMO_SITUATION_ID}`}>
                  <Button size="sm" variant="outline">
                    {sc.openReady}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComingSoonSection({
  reducedMotion,
  copy,
}: {
  reducedMotion: boolean | null;
  copy: LandingCopy;
}) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={transition}
        className="mx-auto max-w-6xl rounded-2xl border border-primary/20 bg-brand/5 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-3">
            <Badge variant="secondary" shape="pill" className="gap-1.5 border-brand/30 text-brand">
              <Icon name="sparkles" size={12} />
              {copy.comingSoonBadge}
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {copy.comingSoonTitle}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.comingSoonBody}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon name="externalLink" size="md" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{copy.esudLabel}</p>
              <p className="text-xs text-muted-foreground">{copy.esudHint}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function CtaSection({
  reducedMotion,
  copy,
  locale,
}: {
  reducedMotion: boolean | null;
  copy: LandingCopy;
  locale: "uz" | "ru";
}) {
  const transition = reducedMotion ? { duration: 0 } : springTransition;

  return (
    <section className="border-t border-border px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={transition}
        className="mx-auto max-w-6xl text-center"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {copy.ctaTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {copy.ctaBody}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={`/situations/${DEMO_SITUATION_ID}`} className="w-full sm:w-auto">
            <Button variant="brand" size="lg" className="w-full gap-2 sm:w-auto">
              <Icon name="sparkles" size="sm" />
              {copy.ctaDemo}
            </Button>
          </Link>
          <Link href="/situations" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              {copy.myCases}
            </Button>
          </Link>
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {COMPLIANCE_NOTE[locale]}
        </p>
      </motion.div>
    </section>
  );
}

export function LandingPageContent() {
  const reducedMotion = useReducedMotion();
  const { locale } = useAppLocale();
  const copy = LANDING_COPY[locale];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader copy={copy} />
      <main aria-label={copy.mainAriaLabel}>
        <HeroSection reducedMotion={reducedMotion} copy={copy} />
        <TransformationSection reducedMotion={reducedMotion} copy={copy} />
        <StatsSection reducedMotion={reducedMotion} copy={copy} />
        <HowItWorksSection reducedMotion={reducedMotion} copy={copy} />
        <ExampleScenariosSection reducedMotion={reducedMotion} copy={copy} />
        <ComingSoonSection reducedMotion={reducedMotion} copy={copy} />
        <CtaSection reducedMotion={reducedMotion} copy={copy} locale={locale} />
      </main>
    </div>
  );
}
