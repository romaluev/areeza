"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@areeza/core/api";
import type { GeneratedDocument } from "@areeza/core/types";
import { Badge } from "@areeza/ui/components/badge";
import { Button } from "@areeza/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import { Icon } from "@areeza/ui/icons";
import { DocumentEditor } from "./document-editor";
import { DocumentStreamingPaper } from "./document-streaming-paper";
import { DocumentSwitcher, DocumentSwitcherHint } from "./document-switcher";
import { RegenerateSectionOverlay } from "./regenerate-section-overlay";
import {
  documentWithSections,
  mergeSectionsContent,
  primaryDocumentId,
  resolveDocumentList,
} from "./document-utils";
import { useDocumentStream } from "./use-document-stream";

export function DocumentPanel({
  caseId,
  documents: documentsProp,
  legacyDocument,
  hasRoute,
  onUpdated,
  onGenerateStart,
}: {
  caseId: string;
  documents?: GeneratedDocument[];
  legacyDocument?: GeneratedDocument;
  hasRoute: boolean;
  onUpdated: () => void;
  onGenerateStart?: () => void;
}) {
  const documentList = useMemo(
    () => resolveDocumentList(documentsProp, legacyDocument),
    [documentsProp, legacyDocument],
  );

  const defaultDocId = useMemo(
    () => primaryDocumentId(documentList, caseId),
    [documentList, caseId],
  );

  const [activeDocId, setActiveDocId] = useState(
    () => documentList[0]?.id ?? `${caseId}-davo`,
  );

  useEffect(() => {
    if (documentList.some((d) => d.id === activeDocId)) return;
    setActiveDocId(defaultDocId);
  }, [documentList, activeDocId, defaultDocId]);
  const [localDoc, setLocalDoc] = useState<GeneratedDocument | null>(
    () => documentList.find((d) => d.id === defaultDocId) ?? documentList[0] ?? null,
  );
  const generatedBaselineRef = useRef<GeneratedDocument | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [regenOpen, setRegenOpen] = useState(false);
  const [regenSectionId, setRegenSectionId] = useState<string | null>(null);
  const [regenStreamText, setRegenStreamText] = useState("");
  const [regenStreaming, setRegenStreaming] = useState(false);

  const stream = useDocumentStream(caseId, activeDocId);

  useEffect(() => {
    stream.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cancel only when switching documents
  }, [activeDocId]);

  useEffect(() => {
    const next =
      documentList.find((d) => d.id === activeDocId) ??
      documentList.find((d) => d.id === defaultDocId) ??
      documentList[0] ??
      null;
    setLocalDoc(next);
    if (next && (next.status === "draft" || next.status === "final")) {
      generatedBaselineRef.current = structuredClone(next);
    }
  }, [documentList, activeDocId, defaultDocId]);

  useEffect(() => {
    if (stream.completedDoc) {
      setLocalDoc(stream.completedDoc);
      generatedBaselineRef.current = structuredClone(stream.completedDoc);
      onUpdated();
      toast.success("Hujjat tayyorlandi");
    }
  }, [stream.completedDoc, onUpdated]);

  useEffect(() => {
    if (stream.error) toast.error(stream.error);
  }, [stream.error]);

  const saveMutation = useMutation({
    mutationFn: (doc: GeneratedDocument) =>
      api.updateDocument({ caseId, document: { ...doc, status: "draft" } }),
    onSuccess: () => onUpdated(),
  });

  const regenerateMutation = useMutation({
    mutationFn: async ({
      sectionId,
      instruction,
    }: {
      sectionId: string;
      instruction?: string;
    }) => {
      if (!localDoc) throw new Error("Hujjat topilmadi");
      setRegenStreaming(true);
      setRegenStreamText("");
      const updated = await api.regenerateSection({
        caseId,
        documentId: localDoc.id,
        sectionId,
        instruction,
      });
      const section = updated.sections.find((s) => s.id === sectionId);
      if (section) {
        for (const chunk of chunkAnimate(section.content)) {
          setRegenStreamText((t) => t + chunk);
          await delay(40);
        }
      }
      return updated;
    },
    onSuccess: (doc) => {
      setLocalDoc(doc);
      generatedBaselineRef.current = structuredClone(doc);
      setRegenStreaming(false);
      setRegenOpen(false);
      onUpdated();
      toast.success("Bo'lim yangilandi");
    },
    onError: () => {
      setRegenStreaming(false);
      toast.error("Bo'limni yangilab bo'lmadi");
    },
  });

  const scheduleSave = useCallback(
    (doc: GeneratedDocument) => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(() => {
        saveMutation.mutate(doc);
      }, 600);
    },
    [saveMutation],
  );

  useEffect(
    () => () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    },
    [],
  );

  const handleSectionChange = useCallback(
    (sectionId: string, content: string) => {
      if (!localDoc) return;
      const next = documentWithSections(
        localDoc,
        mergeSectionsContent(localDoc.sections, sectionId, content),
      );
      setLocalDoc(next);
      scheduleSave(next);
    },
    [localDoc, scheduleSave],
  );

  const handleGenerate = () => {
    onGenerateStart?.();
    generatedBaselineRef.current = null;
    stream.start();
  };

  const handleReset = () => {
    const baseline = generatedBaselineRef.current;
    if (!baseline) {
      toast.message("Asl nusxa saqlanmagan");
      return;
    }
    const restored = structuredClone(baseline);
    setLocalDoc(restored);
    saveMutation.mutate(restored);
    toast.success("Asl matnga qaytarildi");
  };

  const handleRegenerate = (instruction?: string) => {
    const sectionId = regenSectionId ?? localDoc?.sections.find((s) => s.editable)?.id;
    if (!sectionId) return;
    setRegenSectionId(sectionId);
    regenerateMutation.mutate({ sectionId, instruction });
  };

  const isGenerating = stream.streaming || localDoc?.status === "generating";
  const canEdit =
    !isGenerating &&
    !regenStreaming &&
    localDoc &&
    (localDoc.status === "draft" || localDoc.status === "final");
  const showPrepare = hasRoute && documentList.length === 0 && !stream.streaming;
  const showStream = stream.streaming || (stream.sections.length > 0 && !canEdit);
  const editorKey = `${localDoc?.id ?? "doc"}-v${localDoc?.version ?? 0}`;

  const regenSection =
    localDoc?.sections.find((s) => s.id === regenSectionId) ??
    localDoc?.sections.find((s) => s.editable) ??
    null;

  const switcherDocs: GeneratedDocument[] =
    documentList.length > 0 ? documentList : localDoc ? [localDoc] : [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <CardTitle className="text-base">
            {localDoc?.title ?? "Sud hujjati"}
          </CardTitle>
          {localDoc ? <DocumentSwitcherHint doc={localDoc} /> : null}
          <DocumentSwitcher
            documents={switcherDocs}
            activeId={activeDocId}
            onSelect={(id) => {
              if (stream.streaming) {
                stream.cancel();
              }
              setActiveDocId(id);
            }}
            disabled={stream.streaming}
          />
        </div>
        {localDoc?.claimAmount ? (
          <Badge variant="secondary" className="shrink-0">
            {localDoc.claimAmount}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {showPrepare ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-4 py-8 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Marshrut tayyor. Hujjatni bo&apos;limma-bo&apos;lim yaratamiz.
            </p>
            <Button type="button" className="mt-4 gap-2" onClick={handleGenerate}>
              <Icon name="sparkles" size="sm" />
              Hujjatni tayyorlash
            </Button>
          </div>
        ) : null}

        {showStream ? (
          <DocumentStreamingPaper
            sections={stream.sections}
            activeSectionId={stream.activeSectionId}
          />
        ) : null}

        {canEdit && localDoc ? (
          <DocumentEditor
            document={localDoc}
            editorKey={editorKey}
            onSectionChange={handleSectionChange}
          />
        ) : null}

        {!showPrepare && !showStream && !canEdit && hasRoute ? (
          <div className="text-center py-6">
            <Button type="button" onClick={handleGenerate} className="gap-2">
              <Icon name="sparkles" size="sm" />
              Qayta tayyorlash
            </Button>
          </div>
        ) : null}

        {(canEdit || isGenerating) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
            {canEdit ? (
              <>
                <RegenerateSectionOverlay
                  section={regenSection}
                  open={regenOpen}
                  onOpenChange={setRegenOpen}
                  streamingContent={regenStreamText}
                  isStreaming={regenStreaming}
                  onConfirm={handleRegenerate}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleReset}
                  disabled={!generatedBaselineRef.current || saveMutation.isPending}
                >
                  Asl holatiga qaytarish
                </Button>
              </>
            ) : null}
            {isGenerating ? (
              <Button type="button" variant="outline" size="sm" onClick={() => stream.cancel()}>
                To&apos;xtatish
              </Button>
            ) : null}
          </div>
        )}

        <p className="text-[11px] text-[var(--muted-foreground)]">
          Tuzilma shablondan; faktlar murojaatdan to&apos;ldirildi. Sud sarlavhalari himoyalangan.
        </p>
      </CardContent>
    </Card>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function* chunkAnimate(text: string, size = 12) {
  for (let i = 0; i < text.length; i += size) {
    yield text.slice(i, i + size);
  }
}
