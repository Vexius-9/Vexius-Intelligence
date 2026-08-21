"use client";

import React, { useState, useEffect } from "react";
import { VexiusEditorShell } from "@/components/editor/VexiusEditorShell";
import { VexiusDocEditor } from "@/components/editor/docs/VexiusDocEditor";

export default function DocumentPage({ params }: { params: Promise<{ workspaceId: string; docId: string }> }) {
  const unwrappedParams = React.use(params);
  const [docMetadata, setDocMetadata] = useState<any>(null);
  const [docContent, setDocContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const docEditorRef = React.useRef<any>(null);
  const [aiStatus, setAiStatus] = useState<'idle' | 'running' | 'success'>('idle');

  const getCurrentSelection = async (): Promise<string> => {
    if (docEditorRef.current) {
      return docEditorRef.current.getCurrentSelection();
    }
    return "";
  };

  const onApplyAction = (newText: string) => {
    if (docEditorRef.current) {
      docEditorRef.current.applyAction(newText);
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
        return <div>Vexius Sheets (Coming Soon)</div>;
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
      onApplyAction={onApplyAction}
      onAiStart={onAiStart}
      onAiEnd={onAiEnd}
    >
      {renderEditor()}
    </VexiusEditorShell>
  );
}
