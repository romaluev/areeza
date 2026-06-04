"use client";

import { Button } from "@areeza/ui/components/button";
import { Icon } from "@areeza/ui/icons";
import { cn } from "@areeza/ui/lib/utils";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Situation } from "@areeza/core/types";
import {
  getForumGuide,
  getSituationExportBlockers,
  type ExportBlocker,
} from "./situation-export-blockers";

type ExportMutation = UseMutationResult<unknown, Error, void, unknown>;

function BlockerRow({ blocker }: { blocker: ExportBlocker }) {
  return (
    <li
      className={cn(
        "flex gap-3 rounded-lg border px-3 py-2.5 text-sm",
        blocker.kind === "advisory"
          ? "border-destructive/30 bg-destructive/5"
          : "border-warn/30 bg-warn/5",
      )}
    >
      <Icon
        name={blocker.kind === "advisory" ? "alert" : "alertWarn"}
        size="sm"
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{blocker.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{blocker.detail}</p>
        {blocker.actionLabel ? (
          <p className="mt-1 text-xs font-medium text-primary">{blocker.actionLabel}</p>
        ) : null}
      </div>
    </li>
  );
}

export function SituationExportPanel({
  situation,
  exportMutation,
  showDownloadButton = false,
  onGoToReview,
}: {
  situation: Situation;
  exportMutation: ExportMutation;
  /** Workspace footer owns the primary CTA when false. */
  showDownloadButton?: boolean;
  onGoToReview?: () => void;
}) {
  const blockers = getSituationExportBlockers(situation);
  const { documentsReady, documentsTotal, canExport } = situation.readiness;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Topshirish paketi</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {situation.documents.length} ta PDF, dalillar ro&apos;yxati va har bir organ uchun
          yo&apos;riqnoma.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Tayyor hujjatlar:{" "}
          <span className="font-medium text-foreground">
            {documentsReady}/{documentsTotal}
          </span>
        </p>
      </div>

      {blockers.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Eksportdan oldin hal qiling
          </h3>
          <ul className="space-y-2">
            {blockers.map((b) => (
              <BlockerRow key={b.id} blocker={b} />
            ))}
          </ul>
          {onGoToReview ? (
            <button
              type="button"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              onClick={onGoToReview}
            >
              Tekshirish bosqichiga o&apos;tish
            </button>
          ) : null}
        </div>
      ) : null}

      <ul className="space-y-2 text-sm">
        {situation.documents.map((d) => (
          <li key={d.id} className="rounded-lg border border-border px-3 py-2">
            <span className="font-medium">{d.title}</span>
            <span className="mt-0.5 flex items-center gap-1 text-muted-foreground">
              <Icon name="arrowRight" size={12} className="shrink-0" aria-hidden />
              {getForumGuide(d.destination)}
            </span>
          </li>
        ))}
      </ul>

      {showDownloadButton ? (
        <Button
          type="button"
          variant="brand"
          disabled={!canExport || exportMutation.isPending}
          loading={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
        >
          ZIP yuklab olish
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          {canExport
            ? "Pastdagi tugma orqali paketni yuklab oling."
            : "Bloklovchilarni hal qilgach, pastdagi tugma faollashadi."}
        </p>
      )}
    </div>
  );
}
