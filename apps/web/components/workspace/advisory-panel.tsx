"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@areeza/ui/components/button";
import { cn } from "@areeza/ui/lib/utils";
import type { Advisory, Situation } from "@areeza/core/types";
import { COMPLIANCE_NOTE } from "@/lib/copy";

const severityStyles: Record<Advisory["severity"], string> = {
  urgent: "border-danger/50 bg-danger/10 text-danger",
  high: "border-warn/50 bg-warn/10 text-warn",
  medium: "border-primary/30 bg-surface-2",
  info: "border-border bg-surface-1 text-muted",
};

export function AdvisoryPanel({
  situation,
  onAcknowledge,
}: {
  situation: Situation;
  onAcknowledge?: (id: string) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border bg-surface-1">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Maslahatlar</h2>
        <p className="mt-1 text-xs text-muted">
          {situation.readiness.documentsReady}/{situation.readiness.documentsTotal}{" "}
          hujjat tayyor
        </p>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {situation.advisories.length === 0 ? (
          <p className="text-sm text-muted">Hozircha ogohlantirish yo&apos;q.</p>
        ) : (
          situation.advisories.map((adv, i) => (
            <motion.div
              key={adv.id}
              initial={reduced ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reduced ? 0 : i * 0.06 }}
              className={cn("rounded-lg border p-3 text-sm", severityStyles[adv.severity])}
            >
              <p className="font-medium">{adv.title}</p>
              <p className="mt-1 text-xs opacity-90">{adv.body}</p>
              {adv.status === "open" && adv.severity === "urgent" && onAcknowledge ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onAcknowledge(adv.id)}
                >
                  Tanishdim
                </Button>
              ) : null}
            </motion.div>
          ))
        )}
      </div>
      <footer className="shrink-0 border-t border-border p-3 text-[11px] leading-snug text-muted">
        {COMPLIANCE_NOTE}
      </footer>
    </aside>
  );
}
