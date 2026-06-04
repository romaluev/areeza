"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@areeza/ui/components/button";
import { Icon } from "@areeza/ui/icons";
import type { DocSection } from "@areeza/core/types";
import { sectionToHtml } from "./document-utils";

export function DocumentSectionEditor({
  section,
  editorKey,
  onContentChange,
}: {
  section: DocSection;
  editorKey: string;
  onContentChange: (sectionId: string, plainText: string) => void;
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onChangeRef = useRef(onContentChange);
  const lastEmittedRef = useRef<string | null>(null);
  const defaultHtml = sectionToHtml(section);

  useEffect(() => {
    onChangeRef.current = onContentChange;
  }, [onContentChange]);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Matnni tahrirlang…" }),
    ],
    content: defaultHtml,
    editorProps: {
      attributes: {
        class: "legal-section-editor focus:outline-none min-h-[2rem]",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const text = ed.getText({ blockSeparator: "\n" });
        if (text === lastEmittedRef.current) return;
        lastEmittedRef.current = text;
        onChangeRef.current(section.id, text);
      }, 300);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    const text = editor.getText({ blockSeparator: "\n" });
    if (text === section.content) return;
    if (editor.isFocused) return;
    editor.commands.setContent(sectionToHtml(section));
    lastEmittedRef.current = section.content;
  }, [editor, section]);

  if (!editor) return null;

  return (
    <div key={editorKey} data-section-id={section.id} className="legal-editable-section">
      <BubbleMenu editor={editor}>
        <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-md">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Qalin"
          >
            <Icon name="bold" size="sm" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Kursiv"
          >
            <Icon name="italic" size="sm" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Ro'yxat"
          >
            <Icon name="list" size="sm" />
          </Button>
        </div>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}
