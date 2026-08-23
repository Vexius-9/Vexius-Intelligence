import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { VexiusPdfRibbon } from './VexiusPdfRibbon';
import { VexiusPdfCanvasOverlay } from './VexiusPdfCanvasOverlay';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
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

export type PdfTool = 'select' | 'draw' | 'rectangle' | 'ellipse' | 'arrow' | 'note' | 'sign' | 'highlight' | 'underline' | 'strikethrough' | 'eraser';

import * as fabric from 'fabric';

export const VexiusPdfEditor = forwardRef<VexiusPdfEditorRef, VexiusPdfEditorProps>(({ documentId, navbarElement, sidebar }, ref) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isCopilotVisible, setIsCopilotVisible] = useState(true);

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  // Drawing state
  const [activeTool, setActiveTool] = useState<PdfTool>('select');
  const [activeColor, setActiveColor] = useState<string>('#ef4444');
  const [pageDimensions, setPageDimensions] = useState<{ width: number, height: number }>({ width: 0, height: 0 });

  // Annotations state
  const [pageAnnotations, setPageAnnotations] = useState<Record<number, any>>({});
  const pageAnnotationsRef = useRef(pageAnnotations);
  useEffect(() => { pageAnnotationsRef.current = pageAnnotations; }, [pageAnnotations]);

  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleAnnotationsChange = (data: any) => {
    setPageAnnotations(prev => ({ 
      ...prev, 
      [pageNumber]: { 
        data, 
        width: pageDimensions.width, 
        height: pageDimensions.height 
      } 
    }));
    
    // Auto-save debounce
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      saveToBackend();
    }, 2000); // 2 seconds debounce
  };

  const generateFinalPdfBytes = async (): Promise<Uint8Array | null> => {
    if (!pdfUrl) return null;
    try {
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      const pages = pdfDoc.getPages();
      
      for (const [pageNumStr, annotationInfo] of Object.entries(pageAnnotationsRef.current)) {
        const pageIdx = parseInt(pageNumStr) - 1;
        if (pageIdx < 0 || pageIdx >= pages.length || !annotationInfo) continue;
        
        const { data, width: canvasWidth, height: canvasHeight } = annotationInfo;
        const page = pages[pageIdx];
        
        // Render fabric json to an offscreen canvas with the exact dimensions it was drawn
        const canvasEl = document.createElement('canvas');
        canvasEl.width = canvasWidth;
        canvasEl.height = canvasHeight;
        const tempCanvas = new fabric.Canvas(canvasEl, { width: canvasWidth, height: canvasHeight });
        
        await tempCanvas.loadFromJSON(data);
        tempCanvas.renderAll();
        
        const dataUrl = tempCanvas.toDataURL({ format: 'png', multiplier: 2 });
        const pngImage = await pdfDoc.embedPng(dataUrl);
        
        // pdf-lib's drawImage draws from the bottom-left corner
        // The image is scaled back down to the PDF page's original dimensions
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pdfWidth,
          height: pdfHeight,
        });
        
        tempCanvas.dispose();
      }
      
      return await pdfDoc.save();
    } catch (e) {
      console.error("Failed to generate final PDF", e);
      return null;
    }
  };

  const saveToBackend = async () => {
    try {
      const bytes = await generateFinalPdfBytes();
      if (!bytes) return;
      
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        await fetch(`${apiUrl}/documents/${documentId}/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ content: dataUrl })
        });
        console.log('Autosaved PDF');
      };
      
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('Failed to autosave PDF', e);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleFitWidth = () => setZoomLevel(1.5); // approximate for standard screens
  const handleFitPage = () => setZoomLevel(1.0);
  
  const handleRotateLeft = () => setRotation(prev => (prev - 90) % 360);
  const handleRotateRight = () => setRotation(prev => (prev + 90) % 360);

  const handleDeletePage = async () => {
    if (!pdfUrl) return;
    try {
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // pageNumber is 1-indexed, pdf-lib is 0-indexed
      pdfDoc.removePage(pageNumber - 1);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const newUrl = URL.createObjectURL(blob);
      
      // Update viewer
      setPdfUrl(newUrl);
      setNumPages(prev => prev - 1);
      if (pageNumber > 1) setPageNumber(prev => prev - 1);
    } catch (e) {
      console.error("Failed to delete page", e);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const bytes = await generateFinalPdfBytes();
      if (!bytes) return;
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const newUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = newUrl;
      a.download = `Document_${documentId}.pdf`;
      a.click();
      URL.revokeObjectURL(newUrl);
    } catch (e) {
      console.error("Failed to download document", e);
    }
  };

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
    getCurrentSelection: () => "",
    applyAction: () => {}
  }));

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function onPageRenderSuccess(page: any) {
    const viewport = page.getViewport({ scale: zoomLevel, rotation });
    setPageDimensions({ width: viewport.width, height: viewport.height });
  }

  if (!pdfUrl) {
    return <div style={{ padding: '24px' }}>Loading PDF...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Ribbon Toolbar */}
      <VexiusPdfRibbon 
        navbarElement={navbarElement} 
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
        onDeletePage={handleDeletePage}
        onExtractPage={handleDownloadAll}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        activeColor={activeColor}
        onSelectColor={setActiveColor}
        pageNumber={pageNumber}
        numPages={numPages}
      />

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
          gap: '16px',
          flexShrink: 0
        }}>
          <Document 
            file={pdfUrl} 
            onLoadSuccess={onDocumentLoadSuccess} 
            loading={<div style={{ color: '#374151', fontSize: '14px', padding: '10px' }}>Loading...</div>}
            error={<div style={{ color: '#ef4444', fontSize: '14px', padding: '10px' }}>Failed to load PDF.</div>}
            noData={<div style={{ color: '#374151', fontSize: '14px', padding: '10px' }}>No PDF found.</div>}
          >
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
          <Document 
            file={pdfUrl} 
            loading={<div style={{ color: '#374151', fontSize: '16px', padding: '20px' }}>Loading document...</div>}
            error={<div style={{ color: '#ef4444', fontSize: '16px', padding: '20px' }}>Failed to load PDF document.</div>}
            noData={<div style={{ color: '#374151', fontSize: '16px', padding: '20px' }}>No PDF document specified.</div>}
          >
            <div style={{ 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              background: '#fff',
              display: 'inline-block',
              position: 'relative' // Critical for absolute-positioned canvas overlay
            }}>
              <Page 
                pageNumber={pageNumber} 
                scale={zoomLevel}
                rotate={rotation}
                onRenderSuccess={onPageRenderSuccess}
              />
              
              {/* Overlay Canvas for Drawing */}
              {pageDimensions.width > 0 && (
                <VexiusPdfCanvasOverlay
                  key={pageNumber}
                  pageNumber={pageNumber}
                  width={pageDimensions.width}
                  height={pageDimensions.height}
                  tool={activeTool}
                  color={activeColor}
                  initialData={pageAnnotations[pageNumber]?.data}
                  onChange={handleAnnotationsChange}
                />
              )}
            </div>
          </Document>
        </div>

      </div>
    </div>
  );
});

VexiusPdfEditor.displayName = "VexiusPdfEditor";
