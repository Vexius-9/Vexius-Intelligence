"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface DocumentEditorProps {
  initialContent?: string;
  onUpdate?: (content: string) => void;
}

export function DocumentEditor({ initialContent = "", onUpdate }: DocumentEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || "<p>Start writing here...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-p:my-1 prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 focus:outline-none max-w-none",
        style: "min-height: calc(100vh - 120px); padding-bottom: 64px;",
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Formatting Toolbar */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "12px 0",
        borderBottom: "1px solid var(--border-subtle)",
        marginBottom: "24px",
        position: "sticky",
        top: 0,
        background: "var(--bg-primary)",
        zIndex: 10
      }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            background: editor.isActive("bold") ? "var(--text-primary)" : "transparent",
            color: editor.isActive("bold") ? "var(--bg-primary)" : "var(--text-secondary)",
            border: "none",
            padding: "4px 8px",
            borderRadius: "4px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.85rem"
          }}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            background: editor.isActive("italic") ? "var(--text-primary)" : "transparent",
            color: editor.isActive("italic") ? "var(--bg-primary)" : "var(--text-secondary)",
            border: "none",
            padding: "4px 8px",
            borderRadius: "4px",
            fontStyle: "italic",
            cursor: "pointer",
            fontSize: "0.85rem"
          }}
        >
          I
        </button>
        <div style={{ width: "1px", background: "var(--border-subtle)", margin: "0 4px" }} />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={{
            background: editor.isActive("heading", { level: 1 }) ? "var(--text-primary)" : "transparent",
            color: editor.isActive("heading", { level: 1 }) ? "var(--bg-primary)" : "var(--text-secondary)",
            border: "none",
            padding: "4px 8px",
            borderRadius: "4px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.85rem"
          }}
        >
          H1
        </button>
      </div>

      <EditorContent editor={editor} style={{ width: "100%" }} />
      
      <style>{`
        /* Minimal custom styling for TipTap */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-secondary);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
