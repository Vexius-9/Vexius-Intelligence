import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { VexiusPdfRibbon } from './VexiusPdfRibbon';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface VexiusPdfEditorProps {
  documentId: string;
  navbarElement?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export interface VexiusPdfEditorRef {
  getFullText: () => string;
  getCurrentSelection: () => string;
  applyAction: (text: string) => void;
}

export const VexiusPdfEditor = forwardRef<VexiusPdfEditorRef, VexiusPdfEditorProps>(({ documentId, navbarElement, sidebar }, ref) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isCopilotVisible, setIsCopilotVisible] = useState(true);

  useEffect(() => {
    const handleToggleAI = () => setIsCopilotVisible(prev => !prev);
    window.addEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
    return () => window.removeEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
  }, []);

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
    getCurrentSelection: () => `Currently viewing Page ${pageNumber} of ${numPages}`,
    applyAction: () => {}
  }));

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!pdfUrl) {
    return <div style={{ padding: '24px' }}>Loading PDF...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#f3f4f6' }}>
      {/* Top Ribbon */}
      <VexiusPdfRibbon navbarElement={navbarElement} />

      {/* Main Area: Sidebar + Thumbnails + Canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Sidebar (AI Copilot) */}
        {isCopilotVisible && sidebar && (
          <div style={{ 
            width: '320px', 
            flexShrink: 0, 
            background: '#fff', 
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {sidebar}
          </div>
        )}

        {/* Thumbnails Pane */}
        <div style={{ 
          width: '200px', 
          background: '#f9fafb', 
          borderRight: '1px solid #e5e7eb', 
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '16px 0',
          alignItems: 'center',
          gap: '16px'
        }}>
          <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading="Loading...">
            {Array.from(new Array(numPages), (el, index) => (
              <div 
                key={`thumb-${index}`}
                onClick={() => setPageNumber(index + 1)}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  background: pageNumber === index + 1 ? '#fee2e2' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{
                  border: pageNumber === index + 1 ? '2px solid #dc2626' : '1px solid #d1d5db',
                  background: '#fff',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
                  padding: '4px'
                }}>
                  <Page 
                    pageNumber={index + 1} 
                    width={120} 
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </div>
                <span style={{ fontSize: '12px', color: pageNumber === index + 1 ? '#dc2626' : '#6b7280', fontWeight: pageNumber === index + 1 ? 600 : 400 }}>
                  {index + 1}
                </span>
              </div>
            ))}
          </Document>
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'auto', background: '#e5e7eb', padding: '40px' }}>
          <Document file={pdfUrl} loading="Loading document...">
            <div style={{ 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              background: '#fff'
            }}>
              <Page 
                pageNumber={pageNumber} 
                width={800} 
              />
            </div>
          </Document>
        </div>

      </div>
    </div>
  );
});

VexiusPdfEditor.displayName = "VexiusPdfEditor";
