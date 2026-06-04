"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { useMotionTransition } from "@areeza/ui/hooks/use-reduced-motion";
import { Icon } from "@areeza/ui/icons";

const STEPS_UZ = [
  "Muammo tahlil qilinmoqda…",
  "Faktlar ajratilmoqda…",
  "Toifa aniqlanmoqda…",
];
const STEPS_RU = [
  "Анализ ситуации…",
  "Извлечение фактов…",
  "Определение категории…",
];

export function ThinkingIndicator({
  step = 0,
  locale = "uz",
}: {
  step?: number;
  locale?: "uz" | "ru";
}) {
  const transition = useMotionTransition("snappy");
  const steps = locale === "ru" ? STEPS_RU : STEPS_UZ;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="flex items-start gap-3 py-1"
      role="status"
      aria-live="polite"
    >
      <Icon name="sparkles" size="md" className="mt-0.5 shrink-0 text-[var(--accent)]" />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium text-[var(--foreground)]">
          {locale === "ru" ? "Areeza готовит ответ…" : "Areeza tayyorlamoqda…"}
        </p>
        <div className="flex flex-col gap-1.5">
          <Skeleton variant="shimmer" className="h-2 w-[85%] rounded-full" />
          <Skeleton variant="shimmer" className="h-2 w-[60%] rounded-full" />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          {steps[step % steps.length]}
        </p>
      </div>
    </motion.div>
  );
}
