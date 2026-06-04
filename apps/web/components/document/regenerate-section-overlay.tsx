"use client";

import { useState } from "react";
import { Button } from "@areeza/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@areeza/ui/components/dialog";
import { Textarea } from "@areeza/ui/components/textarea";
import { Icon } from "@areeza/ui/icons";
import type { DocSection } from "@areeza/core/types";
import { DocumentSectionStream } from "./document-section-stream";

export function RegenerateSectionOverlay({
  section,
  open,
  onOpenChange,
  streamingContent,
  isStreaming,
  onConfirm,
}: {
  section: DocSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamingContent: string;
  isStreaming: boolean;
  onConfirm: (instruction?: string) => void;
}) {
  const [instruction, setInstruction] = useState("");

  const handleOpen = (next: boolean) => {
    if (!next) setInstruction("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={!section}>
          <Icon name="sparkles" size="sm" />
          Kuchaytirish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bo&apos;limni kuchaytirish</DialogTitle>
          <DialogDescription>
            AI ushbu bo&apos;lim matnini aniqroq qiladi. Qaysi jihatni yaxshilash kerakligini
            yozing (ixtiyoriy).
          </DialogDescription>
        </DialogHeader>
        {!isStreaming ? (
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Masalan: sanalar va summalarni aniqroq yozing"
            rows={3}
            className="resize-none"
          />
        ) : (
          <div
            className="legal-paper max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm"
            aria-live="polite"
          >
            {section ? (
              <DocumentSectionStream
                sectionId={section.id}
                kind={section.kind}
                content={streamingContent}
                isActive
                showCaret
              />
            ) : null}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpen(false)} disabled={isStreaming}>
            Bekor qilish
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(instruction.trim() || undefined)}
            disabled={isStreaming || !section}
          >
            {isStreaming ? "Yozilmoqda…" : "Boshlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
