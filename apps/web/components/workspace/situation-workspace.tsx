"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@areeza/ui/components/tabs";
import { Skeleton } from "@areeza/ui/components/skeleton";
import { Button } from "@areeza/ui/components/button";
import { api, isMockFailureError } from "@areeza/core/api";
import { SituationIntakeRail } from "@/components/intake/situation-intake-rail";
import { AdvisoryPanel } from "./advisory-panel";
import { IssuesPanel } from "./issues-panel";
import { SituationDocumentsPanel } from "./situation-documents-panel";
import { TimelinePanel } from "./timeline-panel";
import { PartiesPanel } from "./parties-panel";
import { EvidencePanel } from "./evidence-panel";
import { SituationExportPanel } from "@/components/export/situation-export-panel";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { showRetryToast } from "@/lib/retry-toast";

export function SituationWorkspace({ situationId }: { situationId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("issues");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: situation, isLoading, isFetched } = useQuery({
    queryKey: ["situation", situationId],
    queryFn: () => api.getSituation(situationId),
  });

  const [activeIssueId, setActiveIssueId] = useState<string | undefined>(
    () => situation?.activeIssueId,
  );
  const resolvedActiveIssue =
    activeIssueId ?? situation?.activeIssueId ?? situation?.issues[0]?.id;

  useEffect(() => {
    if (!isFetched || isLoading) return;
    if (!situation) notFound();
  }, [isFetched, isLoading, situation]);

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

  if (isLoading || !situation) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="min-h-[400px] flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-6">
        <div>
          <h1 className="text-lg font-semibold text-ink">{situation.title}</h1>
          <p className="text-xs text-muted">
            {situation.issues.length} ta masala · {situation.documents.length} ta hujjat
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
            O&apos;chirish
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!situation.readiness.canExport}
            onClick={() => setTab("export")}
          >
            Paketni yuklab olish
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,340px)_1fr_minmax(240px,280px)]">
        <section className="flex min-h-0 flex-col border-r border-border">
          <SituationIntakeRail
            situationId={situationId}
            readOnly={situation.messages.length > 0}
            initialMessages={situation.messages}
          />
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-4 mt-3 shrink-0">
              <TabsTrigger value="issues">Masalalar</TabsTrigger>
              <TabsTrigger value="documents">Hujjatlar</TabsTrigger>
              <TabsTrigger value="timeline">Vaqt</TabsTrigger>
              <TabsTrigger value="parties">Tomonlar</TabsTrigger>
              <TabsTrigger value="evidence">Dalillar</TabsTrigger>
              <TabsTrigger value="export">Topshirish</TabsTrigger>
            </TabsList>
            <TabsContent value="issues" className="min-h-0 flex-1 overflow-hidden">
              <IssuesPanel
                situation={situation}
                activeIssueId={resolvedActiveIssue}
                onSelectIssue={setActiveIssueId}
              />
            </TabsContent>
            <TabsContent value="documents" className="min-h-0 flex-1 overflow-hidden data-[state=active]:flex">
              <SituationDocumentsPanel situationId={situationId} situation={situation} />
            </TabsContent>
            <TabsContent value="timeline" className="min-h-0 flex-1 overflow-auto">
              <TimelinePanel events={situation.timeline} />
            </TabsContent>
            <TabsContent value="parties" className="min-h-0 flex-1 overflow-auto">
              <PartiesPanel parties={situation.parties} />
            </TabsContent>
            <TabsContent value="evidence" className="min-h-0 flex-1 overflow-auto">
              <EvidencePanel evidence={situation.evidence} />
            </TabsContent>
            <TabsContent value="export" className="min-h-0 flex-1 overflow-auto p-4">
              <SituationExportPanel situation={situation} situationId={situationId} />
            </TabsContent>
          </Tabs>
        </section>

        <AdvisoryPanel
          situation={situation}
          onAcknowledge={(id) => ackMutation.mutate(id)}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Holatni o'chirish"
        description="Bu amalni qaytarib bo'lmaydi."
        confirmLabel="O'chirish"
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
