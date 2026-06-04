"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@areeza/ui/components/tabs";
import { Skeleton } from "@areeza/ui/components/skeleton";
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
import { StepProgress } from "./step-progress";

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
        <Skeleton className="h-64 w-full" />
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
  const hasRoute = !!caseData.route;
  const documents = resolveDocumentList(caseData.documents, caseData.document);
  const hasDoc = documents.length > 0;
  const hasValidation = !!caseData.validation;
  const exportDocument = primaryDocument(caseData);

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <h1 className="text-lg font-semibold">{caseData.title}</h1>
        <div className="mt-2">
          <StepProgress current={caseData.step} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!hasRoute && caseData.classification ? (
            <button
              type="button"
              onClick={onRoute}
              className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)]"
            >
              Marshrutni ko&apos;rsatish
            </button>
          ) : null}
          {hasRoute && !hasDoc ? (
            <button
              type="button"
              onClick={onOpenDocument}
              className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)]"
            >
              Hujjatni tayyorlash
            </button>
          ) : null}
          {hasDoc && !hasValidation ? (
            <button
              type="button"
              onClick={onValidate}
              disabled={loadingValidate}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {loadingValidate ? "Tekshirilmoqda…" : "Tekshirish"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="grid flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(320px,380px)_1fr] lg:p-6">
        <section className="flex min-h-0 flex-col gap-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-medium text-[var(--muted-foreground)]">Suhbat</h2>
          <div className="min-h-0 flex-1">
            <MessageList messages={caseData.messages} />
          </div>
          <FactsPanel facts={caseData.facts} />
        </section>

        <section className="min-h-0 overflow-y-auto">
          <Tabs value={tab} onValueChange={onTabChange}>
            <TabsList>
              <TabsTrigger value="route">Marshrut</TabsTrigger>
              <TabsTrigger value="document" disabled={!hasRoute}>
                Hujjat
              </TabsTrigger>
              <TabsTrigger value="validation" disabled={!hasValidation}>
                Tekshiruv
              </TabsTrigger>
              <TabsTrigger value="export" disabled={!hasDoc}>
                Topshirish
              </TabsTrigger>
            </TabsList>
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
              ) : null}
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
          </Tabs>
        </section>
      </div>
    </div>
  );
}
