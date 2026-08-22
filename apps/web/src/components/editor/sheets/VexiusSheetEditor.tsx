import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// Using Handsontable types
import Handsontable from 'handsontable';

import { VexiusSheetRibbon } from './VexiusSheetRibbon';
import { FunctionSquare } from 'lucide-react';

export interface VexiusSheetEditorProps {
  documentId: string;
  initialContent?: any;
  navbarElement?: React.ReactNode;
  documentName?: string;
  sidebar?: React.ReactNode;
}

export interface VexiusSheetEditorRef {
  getFullText: () => string;
  getCurrentSelection: () => string;
  applyAction: (text: string) => void;
}

export const VexiusSheetEditor = forwardRef<VexiusSheetEditorRef, VexiusSheetEditorProps>(({ documentId, initialContent, navbarElement, documentName, sidebar }, ref) => {
  const hotRef = useRef<any>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isCopilotVisible, setIsCopilotVisible] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedCellName, setSelectedCellName] = useState('A1');
  const [formulaValue, setFormulaValue] = useState('');

  useEffect(() => {
    const handleToggleAI = () => setIsCopilotVisible(prev => !prev);
    window.addEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
    return () => window.removeEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
  }, []);

  // Initialize data (either from initialContent or default 50x26 grid)
  const defaultData = Array(50).fill(0).map(() => Array(26).fill(''));
  let startingData = defaultData;

  if (initialContent) {
    try {
      if (typeof initialContent === 'string') {
        startingData = JSON.parse(initialContent);
      } else {
        startingData = initialContent;
      }
    } catch (e) {
      console.error("Failed to parse initial sheet content", e);
    }
  }

  useImperativeHandle(ref, () => ({
    getFullText: () => {
      const hotInstance = hotRef.current?.hotInstance;
      if (!hotInstance) return "";
      
      const data = hotInstance.getData();
      // Format as CSV for LLM readability
      let csv = "Col A, Col B, Col C, Col D, Col E, Col F\n"; // Headers roughly
      for (let r = 0; r < Math.min(data.length, 30); r++) {
        csv += data[r].map((cell: any) => `"${cell || ''}"`).join(",") + "\n";
      }
      return csv;
    },
    getCurrentSelection: () => {
      const hotInstance = hotRef.current?.hotInstance;
      if (!hotInstance) return "";
      const selected = hotInstance.getSelected(); // [[row, col, row2, col2]]
      if (selected && selected.length > 0) {
        return `Selected Cell: Row ${selected[0][0]}, Col ${selected[0][1]}`;
      }
      return "";
    },
    applyAction: (text: string) => {
      const hotInstance = hotRef.current?.hotInstance;
      if (!hotInstance) return;
      
      try {
        // Find JSON block in text
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
        if (jsonMatch) {
          const payload = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          if (payload.action === 'update_cell' && typeof payload.row === 'number' && typeof payload.col === 'number') {
            hotInstance.setDataAtCell(payload.row, payload.col, payload.value);
          }
        }
      } catch (e) {
        console.error("Failed to parse applyAction payload for sheets", e);
      }
    }
  }));

  const saveContent = async (data: any[]) => {
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/documents/${documentId}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // We stringify the JSON array for storage
        body: JSON.stringify({ content: JSON.stringify(data) })
      });
      console.log("Sheet autosaved successfully");
    } catch (e) {
      console.error("Autosave failed", e);
    }
  };


  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAfterChange = (changes: any[] | null, source: string) => {
    // Ignore changes caused by loadData
    if (source === 'loadData') return;
    
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const hotInstance = hotRef.current?.hotInstance;
      if (hotInstance) {
        saveContent(hotInstance.getData());
      }
    }, 2000);
  };

  // Listen to cell selection changes to update formula bar
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const hotInstance = hotRef.current?.hotInstance;
    
    if (hotInstance) {
      hotInstance.addHook('afterSelection', (r: number, c: number) => {
        const colLetter = String.fromCharCode(65 + c);
        setSelectedCellName(`${colLetter}${r + 1}`);
        const val = hotInstance.getDataAtCell(r, c);
        setFormulaValue(val === null || val === undefined ? '' : String(val));
      });
      
      // Force re-render after a short delay to ensure grid lines and cells are drawn properly
      timer = setTimeout(() => {
        if (!hotInstance.isDestroyed) {
          hotInstance.render();
        }
      }, 100);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [startingData]);

  // Use ResizeObserver to pass exact pixel dimensions to HotTable instead of relying on "100%" which crashes it
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: '100%', height: '100%' });

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setDimensions({
            width: `${entry.contentRect.width}px`,
            height: `${entry.contentRect.height}px`
          });
        }
      }
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#f3f4f6' }}>
      {/* Top Ribbon */}
      <VexiusSheetRibbon hotInstance={hotRef.current?.hotInstance} navbarElement={navbarElement} />

      {/* Formula Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '4px 8px', 
        background: '#fff', 
        borderBottom: '1px solid #e5e7eb',
        gap: '8px',
        fontSize: '13px'
      }}>
        <div style={{ 
          width: '60px', 
          border: '1px solid #d1d5db', 
          padding: '2px 4px', 
          borderRadius: '2px', 
          textAlign: 'center', 
          fontWeight: 600,
          background: '#f9fafb'
        }}>
          {selectedCellName}
        </div>
        
        <div style={{ width: '1px', height: '20px', background: '#d1d5db' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280' }}>
          <span style={{ fontStyle: 'italic', fontWeight: 700, fontFamily: 'serif', fontSize: '14px', marginRight: '4px', display: 'flex', alignItems: 'center' }}>
            <FunctionSquare size={16} />
          </span>
        </div>
        
        <input 
          type="text" 
          value={formulaValue}
          onChange={(e) => {
            setFormulaValue(e.target.value);
            // Ideally apply to HotTable here, but keeping it simple for now
          }}
          style={{ 
            flex: 1, 
            border: '1px solid #d1d5db', 
            padding: '2px 8px', 
            borderRadius: '2px',
            outline: 'none'
          }} 
        />
      </div>

      {/* Main Area: Sidebar + Grid */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Solid Left Sidebar (AI Copilot) */}
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

        {/* Sheet Grid Container */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#fff' }} ref={wrapperRef}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {mounted && (
              <HotTable
                ref={hotRef}
                data={startingData}
                rowHeaders={true}
                colHeaders={true}
                height={dimensions.height}
                width={dimensions.width}
                licenseKey="non-commercial-and-evaluation"
                contextMenu={true}
                multiColumnSorting={true}
                manualRowResize={true}
                manualColumnResize={true}
                colWidths={100}
                rowHeights={24}
                autoRowSize={true}
                autoColumnSize={false}
                wordWrap={true}
                afterChange={handleAfterChange}
                minRows={100}
                minCols={26}
                minSpareRows={1}
                minSpareCols={1}
              />
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        background: '#f3f4f6',
        borderTop: '1px solid #e5e7eb',
        padding: '2px 16px',
        fontSize: '11px',
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '24px',
        flexShrink: 0
      }}>
        {/* Left Side: Sheet Tabs */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%', paddingTop: '2px' }}>
          <div style={{ 
            background: '#fff', 
            border: '1px solid #d1d5db', 
            borderBottom: 'none', 
            padding: '2px 16px', 
            fontWeight: 600, 
            color: '#10b981',
            borderRadius: '4px 4px 0 0',
            boxShadow: '0 -1px 2px rgba(0,0,0,0.05)'
          }}>
            Sheet1
          </div>
          <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: '14px', padding: '0 8px' }}>
            +
          </button>
        </div>
        
        {/* Right Side: Zoom */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>Workbook fully loaded</span>
          <div style={{ width: '1px', background: '#d1d5db', height: '12px', margin: '0 4px' }} />
          <button 
            onClick={() => setZoomLevel(z => Math.max(z - 10, 50))} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: '14px', padding: 0, width: '16px' }}
          >
            −
          </button>
          <input 
            type="range" 
            min="50" 
            max="200" 
            value={zoomLevel} 
            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
            style={{ width: '80px', height: '4px', accentColor: '#10b981' }}
          />
          <button 
            onClick={() => setZoomLevel(z => Math.min(z + 10, 200))} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: '14px', padding: 0, width: '16px' }}
          >
            +
          </button>
          <span style={{ width: '40px', textAlign: 'right' }}>{zoomLevel}%</span>
        </div>
      </div>
    </div>
  );
});

VexiusSheetEditor.displayName = "VexiusSheetEditor";
