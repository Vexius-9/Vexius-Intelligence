import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { VexiusTiptapEditor, VexiusTiptapEditorRef } from './VexiusTiptapEditor';

export interface VexiusDocEditorProps {
  documentId: string;
  initialContent?: any;
  aiStatus?: 'idle' | 'running' | 'success';
  onRevertAi?: () => void;
  onAcceptAi?: () => void;
  sidebar?: React.ReactNode;
}

export interface VexiusDocEditorRef {
  getCurrentSelection: () => string;
  getFullText: () => string;
  applyAction: (text: string) => void;
  snapshotStateForAI: () => void;
  revertAIAction: () => void;
}

export const VexiusDocEditor = forwardRef<VexiusDocEditorRef, VexiusDocEditorProps>(({ documentId, initialContent, aiStatus, onRevertAi, onAcceptAi, sidebar }, ref) => {
  const editorRef = useRef<VexiusTiptapEditorRef>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    getCurrentSelection: () => {
      return editorRef.current?.getCurrentSelection() || "";
    },
    getFullText: () => {
      return editorRef.current?.getFullText() || "";
    },
    applyAction: (text: string) => {
      editorRef.current?.applyAction(text);
    },
    snapshotStateForAI: () => {
      // Stub
    },
    revertAIAction: () => {
      // Stub
    }
  }));

  const handleUpdate = (content: string) => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        await fetch(`${apiUrl}/documents/${documentId}/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content })
        });
      } catch (e) {
        console.error("Autosave failed", e);
      }
    }, 2000);
  };

  useEffect(() => {
    const handleForceSave = () => {
      if (editorRef.current) {
        const content = editorRef.current.getJSON();
        if (content) {
          // Immediately save
          if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
          const token = localStorage.getItem("vexius_token");
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          fetch(`${apiUrl}/documents/${documentId}/content`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
          }).catch(e => console.error("Force save failed", e));
        }
      }
    };
    window.addEventListener('vexius:force-save', handleForceSave);
    return () => window.removeEventListener('vexius:force-save', handleForceSave);
  }, [documentId]);

  return (
    <VexiusTiptapEditor 
      ref={editorRef}
      documentId={documentId}
      initialContent={initialContent}
      onUpdate={handleUpdate}
      sidebar={sidebar}
    />
  );
});

VexiusDocEditor.displayName = 'VexiusDocEditor';
