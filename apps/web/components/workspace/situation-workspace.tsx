"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@areeza/ui/components/button";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { Icon } from "@areeza/ui/icons";
import { cn } from "@areeza/ui/lib/utils";
import { motionPresets } from "@areeza/ui/motion/presets";
import { api, isMockFailureError } from "@areeza/core/api";
import type { Advisory, Situation } from "@areeza/core/types";
import { SituationIntakeRail } from "@/components/intake/situation-intake-rail";
import { SituationExportPanel } from "@/components/export/situation-export-panel";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useSituationExport } from "@/lib/use-situation-export";
import { uiCopy } from "@/lib/copy";
import { useAppLocale } from "@/lib/use-app-locale";
import { showRetryToast } from "@/lib/retry-toast";
import { useTopBar } from "@/components/shell/use-top-bar";
import { useActiveSituationStore } from "@/lib/use-active-situation-store";
import { useRightRailStore } from "@/lib/use-right-rail-store";
import { EvidencePanel } from "./evidence-panel";
import { IssuesPanel } from "./issues-panel";
import { PartiesPanel } from "./parties-panel";
import { SituationDocumentsPanel } from "./situation-documents-panel";
import { WorkspaceStepProgress } from "./step-progress";
import { TimelinePanel } from "./timeline-panel";

const WORKSPACE_STEPS = [
  { id: "chat", label: "Suhbat" },
  { id: "documents", label: "Hujjatlar" },
  { id: "review", label: "Tekshirish" },
  { id: "export", label: "Topshirish" },
] as const;

type WorkspaceStep = (typeof WORKSPACE_STEPS)[number]["id"];

const STEP_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function AdvisoryCallout({
  advisories,
  onAcknowledge,
}: {
  advisories: Advisory[];
  onAcknowledge: (id: string) => void;
}) {
  const top = advisories.filter((a) => a.status === "open").slice(0, 2);
  if (top.length === 0) return null;

  return (
    <div className="space-y-2 px-4 pt-4 lg:px-6">
      {top.map((a) => (
        <div
          key={a.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
            a.severity === "urgent" && "border-destructive/30 bg-destructive/5 text-foreground",
            a.severity === "high" && "border-warn/30 bg-warn/5 text-foreground",
            (a.severity === "medium" || a.severity === "info") &&
              "border-border bg-muted/40 text-foreground",
          )}
        >
          <Icon
            name={a.severity === "urgent" ? "alert" : "alertWarn"}
            size="sm"
            className="mt-0.5 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{a.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>
          </div>
          {a.status === "open" ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onAcknowledge(a.id)}>
              Tushundim
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function WorkspaceStepBody({
  step,
  situationId,
  situation,
  resolvedActiveIssue,
  onSelectIssue,
  showDetails,
  onToggleDetails,
  exportMutation,
  onGoToReview,
}: {
  step: WorkspaceStep;
  situationId: string;
  situation: Situation;
  resolvedActiveIssue: string | undefined;
  onSelectIssue: (id: string) => void;
  showDetails: boolean;
  onToggleDetails: () => void;
  exportMutation: ReturnType<typeof useSituationExport>;
  onGoToReview: () => void;
}) {
  if (step === "chat") {
    // Composer stays available so the user can always return here and keep chatting;
    // the backend runs a safe follow-up turn (no re-finalize) on a finalized situation.
    return (
      <SituationIntakeRail
        situationId={situationId}
        initialMessages={situation.messages}
      />
    );
  }
  if (step === "documents") {
    return <SituationDocumentsPanel situationId={situationId} situation={situation} />;
  }
  if (step === "review") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <IssuesPanel
          situation={situation}
          activeIssueId={resolvedActiveIssue}
          onSelectIssue={onSelectIssue}
        />
        <div className="shrink-0 border-t border-border px-4 py-2 lg:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={onToggleDetails}
          >
            <Icon
              name="arrowRight"
              size="sm"
              className={cn("transition-transform", showDetails && "rotate-90")}
            />
            Tafsilotlar
          </Button>
          {showDetails ? (
            <div className="mt-3 grid gap-4 lg:grid-cols-3">
              <TimelinePanel events={situation.timeline} />
              <PartiesPanel parties={situation.parties} />
              <EvidencePanel evidence={situation.evidence} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-y-auto p-4 lg:p-6">
      <SituationExportPanel
        situation={situation}
        exportMutation={exportMutation}
        onGoToReview={onGoToReview}
      />
    </div>
  );
}

export function SituationWorkspace({ situationId }: { situationId: string }) {
  const { data: situation, isLoading, isFetched } = useQuery({
    queryKey: ["situation", situationId],
    queryFn: () => api.getSituation(situationId),
  });

  useEffect(() => {
    if (!isFetched || isLoading) return;
    if (!situation) notFound();
  }, [isFetched, isLoading, situation]);

  if (isLoading || !situation) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="min-h-[400px] flex-1" />
      </div>
    );
  }

  return <SituationWorkspaceLoaded situation={situation} situationId={situationId} />;
}

function SituationWorkspaceLoaded({
  situation,
  situationId,
}: {
  situation: Situation;
  situationId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useAppLocale();
  const copy = uiCopy(locale);
  const topBarConfig = useMemo(() => ({ title: situation.title }), [situation.title]);
  useTopBar(topBarConfig);
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState<WorkspaceStep>("chat");
  const toggleRail = useRightRailStore((s) => s.toggle);

  // Publish the active situation + step to the shell so the assistant rail
  // knows what to render. Clears on unmount.
  useEffect(() => {
    useActiveSituationStore.getState().setActive(situationId, step);
  }, [situationId, step]);
  useEffect(() => {
    return () => useActiveSituationStore.getState().clear();
  }, []);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeIssueId, setActiveIssueId] = useState<string | undefined>(
    () => situation.activeIssueId,
  );

  const exportMutation = useSituationExport(situationId, situation);
  const resolvedActiveIssue =
    activeIssueId ?? situation.activeIssueId ?? situation.issues[0]?.id;

  const ackMutation = useMutation({
    mutationFn: (advisoryId: string) => api.acknowledgeAdvisory(situationId, advisoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["situation", situationId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteSituation(situationId),
    onSuccess: () => {
      toast.success("Holat o'chirildi");
      router.push("/situations");
    },
    onError: (err) => {
      if (isMockFailureError(err)) {
        showRetryToast("O'chirish bajarilmadi", () => deleteMutation.mutate());
      }
    },
  });

  const stepIndex = WORKSPACE_STEPS.findIndex((s) => s.id === step);
  const primaryCta = useMemo(() => {
    if (step === "chat") return { label: "Hujjatlarga o'tish", next: "documents" as const };
    if (step === "documents") return { label: "Tekshirishga o'tish", next: "review" as const };
    if (step === "review") return { label: "Topshirishga o'tish", next: "export" as const };
    return {
      label: "Paketni yuklab olish",
      next: null,
      disabled: !situation.readiness.canExport || exportMutation.isPending,
    };
  }, [step, situation.readiness.canExport, exportMutation.isPending]);

  const stepTransition = reducedMotion
    ? { duration: 0 }
    : { ...motionPresets.base, ease: "easeOut" as const };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 space-y-3 border-b border-border px-4 py-3 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{situation.title}</h1>
            <p className="text-xs text-muted-foreground">
              {situation.issues.length} ta masala · {situation.documents.length} ta hujjat
            </p>
          </div>
          <div className="flex items-center gap-1">
            {step !== "chat" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                aria-label={copy.assistantRailToggle}
                onClick={toggleRail}
              >
                <Icon name="sparkles" size="sm" />
                {copy.assistantRailTitle}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={copy.deleteSituationTitle}
              onClick={() => setDeleteOpen(true)}
            >
              {copy.deleteConfirm}
            </Button>
          </div>
        </div>
        <WorkspaceStepProgress
          steps={WORKSPACE_STEPS}
          currentIndex={stepIndex}
          onStepClick={(index) => {
            if (index < stepIndex) {
              setStep(WORKSPACE_STEPS[index]!.id);
            }
          }}
        />
      </header>

      <AdvisoryCallout
        advisories={situation.advisories}
        onAcknowledge={(id) => ackMutation.mutate(id)}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="absolute inset-0 flex min-h-0 flex-col overflow-hidden"
            initial={reducedMotion ? false : STEP_MOTION.initial}
            animate={reducedMotion ? undefined : STEP_MOTION.animate}
            exit={reducedMotion ? undefined : STEP_MOTION.exit}
            transition={stepTransition}
          >
            <WorkspaceStepBody
              step={step}
              situationId={situationId}
              situation={situation}
              resolvedActiveIssue={resolvedActiveIssue}
              onSelectIssue={setActiveIssueId}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails((v) => !v)}
              exportMutation={exportMutation}
              onGoToReview={() => setStep("review")}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-3 lg:px-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={stepIndex <= 0}
          onClick={() => setStep(WORKSPACE_STEPS[Math.max(0, stepIndex - 1)]!.id)}
        >
          Orqaga
        </Button>
        <Button
          type="button"
          variant="brand"
          size="sm"
          disabled={primaryCta.disabled}
          loading={step === "export" && exportMutation.isPending}
          onClick={() => {
            if (primaryCta.next) {
              setStep(primaryCta.next);
              return;
            }
            exportMutation.mutate();
          }}
        >
          {primaryCta.label}
        </Button>
      </footer>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={copy.deleteSituationTitle}
        description={copy.deleteSituationDescription}
        confirmLabel={copy.deleteConfirm}
        cancelLabel={copy.deleteCancel}
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
