import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';

// Using Handsontable types
import Handsontable from 'handsontable';

export interface VexiusSheetEditorProps {
  documentId: string;
  initialContent?: any;
}

export interface VexiusSheetEditorRef {
  getFullText: () => string;
  getCurrentSelection: () => string;
  applyAction: (text: string) => void;
}

export const VexiusSheetEditor = forwardRef<VexiusSheetEditorRef, VexiusSheetEditorProps>(({ documentId, initialContent }, ref) => {
  const hotRef = useRef<any>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', padding: '24px', background: '#f3f4f6' }}>
      <div style={{ width: '100%', height: '100%', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '8px', overflow: 'hidden' }}>
        <HotTable
          ref={hotRef}
          data={startingData}
          rowHeaders={true}
          colHeaders={true}
          height="100%"
          width="100%"
          licenseKey="non-commercial-and-evaluation"
          contextMenu={true}
          multiColumnSorting={true}
          manualRowResize={true}
          manualColumnResize={true}
          afterChange={handleAfterChange}
          minRows={50}
          minCols={26}
        />
      </div>
    </div>
  );
});

VexiusSheetEditor.displayName = "VexiusSheetEditor";
