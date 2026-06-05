"use client";

import { useMemo, useState } from "react";
import { FirstRunOnboarding } from "@/components/onboarding/first-run-onboarding";
import { uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import { SituationIntakeRail } from "./situation-intake-rail";
import { useTopBar } from "@/components/shell/use-top-bar";

export function SituationIntakePage({ seedText }: { seedText?: string }) {
  const { locale } = useAppLocale();
  const copy = uiCopy(locale);
  const topBarConfig = useMemo(() => ({ title: copy.newSituationPageTitle }), [copy.newSituationPageTitle]);
  useTopBar(topBarConfig);
  const [onboardingSeed, setOnboardingSeed] = useState<string | undefined>();
  const effectiveSeed = onboardingSeed ?? seedText;

  return (
    <div className="flex h-[calc(100vh-var(--header-h,0px))] min-h-0 flex-col lg:h-full">
      <FirstRunOnboarding onPickPrompt={setOnboardingSeed} />
      <header className="shrink-0 border-b border-border/60 px-6 py-4">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-lg font-semibold text-foreground">{copy.newSituationPageTitle}</h1>
          <p className="text-xs text-muted-foreground">{copy.newSituationPageSubtitle}</p>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <SituationIntakeRail
          key={onboardingSeed ? "onboarding-seed" : "default"}
          situationId="situation-intake-new"
          seedText={effectiveSeed}
        />
      </div>
    </div>
  );
}
