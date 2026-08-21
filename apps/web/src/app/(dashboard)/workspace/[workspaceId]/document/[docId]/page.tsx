"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { VexiusEditorShell } from "@/components/editor/VexiusEditorShell";
import { VexiusDocEditor, VexiusDocEditorRef } from "@/components/editor/docs/VexiusDocEditor";
import { VexiusSheetEditor, VexiusSheetEditorRef } from '@/components/editor/sheets/VexiusSheetEditor';

export default function DocumentPage({ params }: { params: Promise<{ workspaceId: string; docId: string }> }) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const [docMetadata, setDocMetadata] = useState<any>(null);
  const [docContent, setDocContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const docEditorRef = useRef<VexiusDocEditorRef>(null);
  const sheetEditorRef = useRef<VexiusSheetEditorRef>(null);

  useEffect(() => {
    const initDocument = async () => {
      try {
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        const metaRes = await fetch(`${apiUrl}/documents/${unwrappedParams.docId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (metaRes.ok) {
          const data = await metaRes.json();
          setDocMetadata(data);
          
          if (data.type === 'document' || data.type === 'docx') {
            const contentRes = await fetch(`${apiUrl}/documents/${unwrappedParams.docId}/json`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (contentRes.ok) {
              setDocContent(await contentRes.json());
            }
          }
        }
      } catch (err) {
        console.error("Failed to load document", err);
      } finally {
        setLoading(false);
      }
    };
    initDocument();
  }, [unwrappedParams.docId]);

  const handleRename = async (newName: string) => {
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/documents/${unwrappedParams.docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        setDocMetadata({ ...docMetadata, name: newName });
      } else {
        throw new Error("Failed to rename");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to rename document");
    }
  };

  const [aiStatus, setAiStatus] = useState<'idle' | 'running' | 'success'>('idle');

  const getCurrentSelection = async (): Promise<string> => {
    if (docMetadata?.type === 'spreadsheet' || docMetadata?.type === 'xlsx') {
      if (sheetEditorRef.current && sheetEditorRef.current.getCurrentSelection) {
        return sheetEditorRef.current.getCurrentSelection();
      }
    } else {
      if (docEditorRef.current && docEditorRef.current.getCurrentSelection) {
        return docEditorRef.current.getCurrentSelection();
      }
    }
    return "";
  };

  const getFullText = async (): Promise<string> => {
    if (docMetadata?.type === 'spreadsheet' || docMetadata?.type === 'xlsx') {
      if (sheetEditorRef.current && sheetEditorRef.current.getFullText) {
        return sheetEditorRef.current.getFullText();
      }
    } else {
      if (docEditorRef.current && docEditorRef.current.getFullText) {
        return docEditorRef.current.getFullText();
      }
    }
    return "";
  };

  const onApplyAction = (newText: string) => {
    if (docMetadata?.type === 'spreadsheet' || docMetadata?.type === 'xlsx') {
      if (sheetEditorRef.current) {
        sheetEditorRef.current.applyAction(newText);
      }
    } else {
      if (docEditorRef.current) {
        docEditorRef.current.applyAction(newText);
      }
    }
  };

  const onAiStart = () => {
    setAiStatus('running');
    if (docEditorRef.current && docEditorRef.current.snapshotStateForAI) {
      docEditorRef.current.snapshotStateForAI();
    }
  };

  const onAiEnd = () => {
    setAiStatus('success');
  };

  const onRevertAi = () => {
    if (docEditorRef.current && docEditorRef.current.revertAIAction) {
      docEditorRef.current.revertAIAction();
    }
    setAiStatus('idle');
  };

  const onAcceptAi = () => {
    setAiStatus('idle');
  };

  const renderEditor = () => {
    if (!docMetadata) return null;
    
    // Switch based on document type
    switch (docMetadata.type) {
      case 'document':
      case 'docx':
        return <VexiusDocEditor ref={docEditorRef} documentId={docMetadata.id} initialContent={docContent} aiStatus={aiStatus} onRevertAi={onRevertAi} onAcceptAi={onAcceptAi} />;
      case 'spreadsheet':
      case 'xlsx':
        return <VexiusSheetEditor ref={sheetEditorRef} documentId={docMetadata.id} initialContent={docContent} />;
      default:
        return <div>Unsupported document type</div>;
    }
  };

  return (
    <VexiusEditorShell
      documentId={unwrappedParams.docId}
      workspaceId={unwrappedParams.workspaceId}
      documentType={docMetadata?.type || 'document'}
      documentName={docMetadata?.name || ''}
      onRename={handleRename}
      loading={loading}
      getCurrentSelection={getCurrentSelection}
      getFullText={getFullText}
      onApplyAction={onApplyAction}
      onAiStart={onAiStart}
      onAiEnd={onAiEnd}
    >
      {renderEditor()}
    </VexiusEditorShell>
  );
}
