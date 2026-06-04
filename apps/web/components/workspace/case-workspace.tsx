"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@areeza/ui/components/tabs";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { Button } from "@areeza/ui/components/button";
import { api } from "@areeza/core/api";
import type { CaseDetail } from "@areeza/core/types";
import { primaryDocument } from "@areeza/core/types";
import { MessageList } from "@/components/intake/message-list";
import { FactsPanel } from "@/components/facts/facts-panel";
import { RouteCard } from "@/components/route/route-card";
import { DocumentPanel } from "@/components/document/document-panel";
import { resolveDocumentList } from "@/components/document/document-utils";
import { ValidationPanel } from "@/components/validation/validation-panel";
import { ExportPanel } from "@/components/export/export-panel";
import { useIntakeStore } from "@/lib/use-intake-store";
import { COMPLIANCE_NOTE } from "@/lib/copy";
import { StepProgress } from "./step-progress";
import { TrackingPanel } from "./tracking-panel";

const WORKSPACE_TABS_LAYOUT = "areeza-workspace-tabs";

export function CaseWorkspace({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("route");

  const { data: caseData, isLoading, isError, refetch } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => api.getCase(caseId),
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      const c = await api.getCase(caseId);
      const docId = c?.document?.id ?? "doc";
      return api.validate(caseId, docId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      setTab("validation");
      toast.success("Tekshiruv yakunlandi");
    },
  });

  const routeMutation = useMutation({
    mutationFn: async () => {
      const c = await api.getCase(caseId);
      if (!c?.classification) throw new Error("No classification");
      return api.route(
        {
          categoryCode: c.classification.categoryCode,
          facts: c.facts,
        },
        caseId,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      toast.success("Marshrut tayyor");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-full max-w-xl" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  if (isError || !caseData) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--danger)]">Ish yuklanmadi.</p>
        <button
          type="button"
          className="mt-2 text-sm text-[var(--primary)] underline"
          onClick={() => refetch()}
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <CaseWorkspaceInner
      caseData={caseData}
      tab={tab}
      onTabChange={setTab}
      onRoute={() => routeMutation.mutate()}
      onOpenDocument={() => setTab("document")}
      onValidate={() => validateMutation.mutate()}
      loadingValidate={validateMutation.isPending}
    />
  );
}

function CaseWorkspaceInner({
  caseData,
  tab,
  onTabChange,
  onRoute,
  onOpenDocument,
  onValidate,
  loadingValidate,
}: {
  caseData: CaseDetail;
  tab: string;
  onTabChange: (t: string) => void;
  onRoute: () => void;
  onOpenDocument: () => void;
  onValidate: () => void;
  loadingValidate: boolean;
}) {
  const queryClient = useQueryClient();
  const locale = useIntakeStore((s) => s.locale);
  const hasRoute = !!caseData.route;
  const documents = resolveDocumentList(caseData.documents, caseData.document);
  const hasDoc = documents.length > 0;
  const hasValidation = !!caseData.validation;
  const exportDocument = primaryDocument(caseData);
  const statusHistory = caseData.statusHistory ?? [];

  return (
    <div className="flex h-[calc(100dvh-0px)] flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
          {caseData.title}
        </h1>
        <div className="mt-2">
          <StepProgress current={caseData.step} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!hasRoute && caseData.classification ? (
            <Button type="button" size="sm" onClick={onRoute}>
              Marshrutni ko&apos;rsatish
            </Button>
          ) : null}
          {hasRoute && !hasDoc ? (
            <Button type="button" size="sm" onClick={onOpenDocument}>
              Hujjatni tayyorlash
            </Button>
          ) : null}
          {hasDoc && !hasValidation ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onValidate}
              disabled={loadingValidate}
            >
              {loadingValidate ? "Tekshirilmoqda…" : "Tekshirish"}
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(300px,380px)_1fr] lg:p-6">
        <section className="flex min-h-0 flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-2)]">
          <h2 className="eyebrow">Suhbat</h2>
          <div className="min-h-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2">
            <MessageList messages={caseData.messages} locale={locale} />
          </div>
          <FactsPanel facts={caseData.facts} />
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden">
          <Tabs value={tab} onValueChange={onTabChange} className="flex min-h-0 flex-1 flex-col">
            <TabsList
              layoutId={WORKSPACE_TABS_LAYOUT}
              className="h-auto w-full flex-col gap-1 sm:h-8 sm:flex-row sm:flex-nowrap"
            >
              <TabsTrigger
                value="route"
                layoutId={WORKSPACE_TABS_LAYOUT}
                className="w-full sm:flex-1"
              >
                Marshrut
              </TabsTrigger>
              <TabsTrigger
                value="document"
                layoutId={WORKSPACE_TABS_LAYOUT}
                disabled={!hasRoute}
                className="w-full sm:flex-1"
              >
                Hujjat
              </TabsTrigger>
              <TabsTrigger
                value="validation"
                layoutId={WORKSPACE_TABS_LAYOUT}
                disabled={!hasValidation}
                className="w-full sm:flex-1"
              >
                Tekshiruv
              </TabsTrigger>
              <TabsTrigger
                value="tracking"
                layoutId={WORKSPACE_TABS_LAYOUT}
                className="w-full sm:flex-1"
              >
                Kuzatuv
              </TabsTrigger>
              <TabsTrigger
                value="export"
                layoutId={WORKSPACE_TABS_LAYOUT}
                disabled={!hasDoc}
                className="w-full sm:flex-1"
              >
                Topshirish
              </TabsTrigger>
            </TabsList>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <TabsContent value="route" className="space-y-4">
                {caseData.route && caseData.classification ? (
                  <RouteCard route={caseData.route} classification={caseData.classification} />
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Marshrutni yuklash uchun yuqoridagi tugmani bosing.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="document">
                {hasRoute ? (
                  <DocumentPanel
                    caseId={caseData.id}
                    documents={caseData.documents}
                    legacyDocument={caseData.document}
                    hasRoute={hasRoute}
                    onUpdated={() =>
                      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] })
                    }
                    onGenerateStart={onOpenDocument}
                  />
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Avval marshrutni ko&apos;rsating.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="validation">
                {caseData.validation ? (
                  <ValidationPanel result={caseData.validation} />
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Hujjat tayyorlangandan keyin tekshiruv mavjud bo&apos;ladi.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="tracking">
                <TrackingPanel events={statusHistory} currentStep={caseData.step} />
              </TabsContent>
              <TabsContent value="export" className="space-y-4">
                <ExportPanel
                  caseId={caseData.id}
                  caseTitle={caseData.title}
                  document={exportDocument}
                  documents={caseData.documents}
                  route={caseData.route}
                  validation={caseData.validation}
                />
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </div>

      <p className="border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--muted-foreground)] lg:px-6">
        {COMPLIANCE_NOTE}
      </p>
    </div>
  );
}
