import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface VexiusPdfEditorProps {
  documentId: string;
}

export interface VexiusPdfEditorRef {
  getFullText: () => string;
  getCurrentSelection: () => string;
  applyAction: (text: string) => void;
}

export const VexiusPdfEditor = forwardRef<VexiusPdfEditorRef, VexiusPdfEditorProps>(({ documentId }, ref) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/documents/${documentId}/download`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setPdfUrl(data.url);
        }
      } catch (e) {
        console.error("Failed to fetch PDF URL", e);
      }
    };
    fetchUrl();
  }, [documentId]);

  useImperativeHandle(ref, () => ({
    getFullText: () => "", // Handled server-side by AI service on the fly or chunked
    getCurrentSelection: () => "",
    applyAction: () => {}
  }));

  if (!pdfUrl) {
    return <div style={{ padding: '24px' }}>Loading PDF...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <iframe 
        src={pdfUrl} 
        width="100%" 
        height="100%" 
        style={{ border: 'none' }}
        title="PDF Viewer"
      />
    </div>
  );
});

VexiusPdfEditor.displayName = "VexiusPdfEditor";
