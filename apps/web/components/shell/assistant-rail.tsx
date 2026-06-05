"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@areeza/core/api";
import { Button } from "@areeza/ui/components/button";
import { Icon } from "@areeza/ui/icons";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { SituationIntakeRail } from "@/components/intake/situation-intake-rail";
import { uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import { useActiveSituationStore } from "@/lib/use-active-situation-store";
import { useRightRailStore } from "@/lib/use-right-rail-store";

/**
 * Persistent assistant rail body. Renders the active situation's intake
 * conversation (reusing SituationIntakeRail + the Phase-2 trace panel + question
 * wizard) so the assistant stays reachable on every workspace step except Chat
 * (where the conversation already fills the canvas).
 */
export function AssistantRail({ onClose }: { onClose?: () => void }) {
  const { locale } = useAppLocale();
  const copy = uiCopy(locale);
  const situationId = useActiveSituationStore((s) => s.situationId);
  const step = useActiveSituationStore((s) => s.step);
  const setOpen = useRightRailStore((s) => s.setOpen);

  const { data: situation, isLoading } = useQuery({
    queryKey: ["situation", situationId],
    queryFn: () => api.getSituation(situationId as string),
    enabled: Boolean(situationId),
  });

  if (!situationId || step === "chat") return null;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-border/40 bg-card shadow-sm">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name="sparkles" size="sm" className="text-brand" />
          <span className="truncate text-sm font-semibold tracking-tight">
            {copy.assistantRailTitle}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={copy.assistantRailClose}
          onClick={() => {
            setOpen(false);
            onClose?.();
          }}
        >
          <Icon name="cancel" size="sm" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading || !situation ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-2/3 self-end" />
          </div>
        ) : (
          <SituationIntakeRail
            situationId={situationId}
            initialMessages={situation.messages}
          />
        )}
      </div>
    </div>
  );
}
