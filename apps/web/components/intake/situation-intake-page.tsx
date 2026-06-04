"use client";

import { SituationIntakeRail } from "./situation-intake-rail";

export function SituationIntakePage({ seedText }: { seedText?: string }) {
  return (
    <div className="flex h-[calc(100vh-var(--header-h,0px))] min-h-0 flex-col lg:h-full">
      <header className="shrink-0 border-b border-border px-4 py-3 lg:px-6">
        <h1 className="text-lg font-semibold text-ink">Yangi holat</h1>
        <p className="text-xs text-muted">Vaziyatingizni tasvirlang — Areeza yo&apos;nalishlarni aniqlaydi.</p>
      </header>
      <div className="min-h-0 flex-1">
        <SituationIntakeRail situationId="situation-intake-new" seedText={seedText} />
      </div>
    </div>
  );
}
