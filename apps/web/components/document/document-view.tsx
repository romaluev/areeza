"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Icon } from "@areeza/ui/icons";
import { useEffect } from "react";
import { Button } from "@areeza/ui/components/button";
import { Badge } from "@areeza/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@areeza/ui/components/card";
import type { GeneratedDocument } from "@areeza/core/types";

function plainTextToHtml(text: string): string {
  const lines = text.split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "<p><br></p>";
      if (
        trimmed === "DA'VO ARIZASI" ||
        trimmed.includes("DA'VO ARIZASI") ||
        trimmed === "SO'RAYMAN:" ||
        trimmed.startsWith("SO'RAYMAN")
      ) {
        return `<h2>${escapeHtml(line)}</h2>`;
      }
      if (line.includes("sudiga") || line.includes("Hisob raqami") || line.includes("STIR")) {
        return `<p class="legal-mono">${escapeHtml(line)}</p>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function DocumentView({ document }: { document: GeneratedDocument }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Hujjat matni…",
      }),
    ],
    content: plainTextToHtml(document.plainText),
    editorProps: {
      attributes: {
        class: "legal-paper focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && document.plainText) {
      editor.commands.setContent(plainTextToHtml(document.plainText));
    }
  }, [editor, document.plainText, document.version]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{document.title}</CardTitle>
        <Badge variant="secondary">{document.claimAmount}</Badge>
      </CardHeader>
      <CardContent>
        <div
          id="print-document"
          className="legal-paper relative overflow-hidden rounded-lg border border-[var(--border)] bg-[#fcfbf7] px-6 py-8 shadow-inner dark:bg-[#1a1814]"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[var(--primary)]/20 via-[var(--accent-gold)]/30 to-[var(--primary)]/20" />
          {editor ? (
            <>
              <BubbleMenu editor={editor}>
                <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-md">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    <Icon name="bold" size="sm" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    <Icon name="italic" size="sm" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                  >
                    <Icon name="list" size="sm" />
                  </Button>
                </div>
              </BubbleMenu>
              <EditorContent editor={editor} />
            </>
          ) : (
            <pre className="whitespace-pre-wrap text-sm">{document.plainText}</pre>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Icon name="printer" size="sm" />
            Chop etish / PDF
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
          Tuzilma shablondan; faktlar murojaatdan to&apos;ldirildi. Tahrirlash mumkin.
        </p>
      </CardContent>
    </Card>
  );
}
