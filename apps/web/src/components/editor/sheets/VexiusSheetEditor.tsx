import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { VexiusCustomFormulas } from './VexiusFormulas';

registerAllModules();
HyperFormula.registerFunctionPlugin(VexiusCustomFormulas, VexiusCustomFormulas.translations);

// Create a HyperFormula instance with our custom plugin enabled
const hfInstance = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
});
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// Using Handsontable types
import Handsontable from 'handsontable';

import { VexiusSheetRibbon } from './VexiusSheetRibbon';
import { FunctionSquare, Grid, PaintBucket, Sparkles } from 'lucide-react';

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
  const [floatingMenu, setFloatingMenu] = useState<{ visible: boolean, top: number, left: number, range: number[] | null, aiMode: boolean }>({ visible: false, top: 0, left: 0, range: null, aiMode: false });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingFormula, setIsGeneratingFormula] = useState(false);

  useEffect(() => {
    const handleToggleAI = () => setIsCopilotVisible(prev => !prev);
    window.addEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
    return () => window.removeEventListener('vexius:toggle-ai', handleToggleAI as EventListener);
  }, []);

  const [sheetData, setSheetData] = useState(() => {
    let data = Array(50).fill(0).map(() => Array(26).fill(''));
    if (initialContent) {
      try {
        if (typeof initialContent === 'string') {
          data = JSON.parse(initialContent);
        } else {
          data = initialContent;
        }
      } catch (e) {
        console.error("Failed to parse initial sheet content", e);
      }
    }
    return data;
  });

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
        // 1. Try to parse Markdown Table for templates
        const lines = text.split('\n');
        const tableLines = lines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
        if (tableLines.length > 0) {
          const data2D = [];
          for (const line of tableLines) {
            // Ignore separator lines like |---|---|
            if (line.match(/^\|[\s\-\|:]+\|$/)) continue;
            const cols = line.split('|').slice(1, -1).map(c => {
              let val = c.trim();
              // Remove markdown bold (**) and italic (*) 
              val = val.replace(/\*\*(.*?)\*\*/g, '$1');
              val = val.replace(/\*(.*?)\*/g, '$1');
              val = val.replace(/__(.*?)__/g, '$1');
              val = val.replace(/_(.*?)_/g, '$1');
              return val;
            });
            data2D.push(cols);
          }
          
          if (data2D.length > 0) {
            // Update state so re-renders don't reset the grid
            setSheetData(data2D);
            // Because it's a template, we load it as the entire sheet content to make it clean
            hotInstance.loadData(data2D);
            
            for (let r = 0; r < data2D.length; r++) {
              for (let c = 0; c < data2D[0].length; c++) {
                let cellClass = 'ht-border-template';
                // Add header styling for the first row
                if (r === 0) {
                  cellClass += ' htCenter htMiddle ht-header-bold';
                }
                hotInstance.setCellMeta(r, c, 'className', cellClass);
              }
            }
            hotInstance.render();

            // Force a save to persist the new template
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('vexius:force-save-sheet'));
            }, 500);
            return;
          }
        }

        // 2. Fallback to single cell update via JSON
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
    
    // Check if AutoSave is enabled in localStorage
    if (typeof window !== 'undefined') {
      const isAutoSave = localStorage.getItem('vexius_autosave');
      if (isAutoSave !== null && JSON.parse(isAutoSave) === false) {
        return; // AutoSave is disabled, do nothing
      }
    }

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const hotInstance = hotRef.current?.hotInstance;
      if (hotInstance) {
        saveContent(hotInstance.getData());
      }
    }, 2000);
  };

  useEffect(() => {
    const handleForceSave = () => {
      const hotInstance = hotRef.current?.hotInstance;
      if (hotInstance) {
        saveContent(hotInstance.getData());
      }
    };
    
    window.addEventListener('vexius:force-save-sheet', handleForceSave);
    return () => window.removeEventListener('vexius:force-save-sheet', handleForceSave);
  }, [documentId]);

  const handleSelectionEnd = useCallback((r: number, c: number, r2: number, c2: number) => {
    const colLetter = String.fromCharCode(65 + c);
    setSelectedCellName(`${colLetter}${r + 1}`);
    const hotInst = hotRef.current?.hotInstance;
    if (!hotInst) return;
    
    const val = hotInst.getSourceDataAtCell(r, c);
    setFormulaValue(val === null || val === undefined ? '' : String(val));

    // Show floating toolbar for multi-cell selections
    const isMultiCell = r !== r2 || c !== c2;
    if (isMultiCell) {
      setTimeout(() => {
        const currentHotInst = hotRef.current?.hotInstance;
        if (!currentHotInst) return;
        
        const corners = [
          [Math.max(r, r2), Math.max(c, c2)], // Bottom Right
          [Math.min(r, r2), Math.max(c, c2)], // Top Right
          [Math.max(r, r2), Math.min(c, c2)], // Bottom Left
          [Math.min(r, r2), Math.min(c, c2)]  // Top Left
        ];
        
        let cellElement = null;
        for (const [cr, cc] of corners) {
          cellElement = currentHotInst.getCell(cr, cc);
          if (cellElement) break;
        }
        
        const wrapperRect = wrapperRef.current?.getBoundingClientRect();
        
        if (wrapperRect) {
          if (cellElement) {
            const cellRect = cellElement.getBoundingClientRect();
            const newTop = cellRect.bottom - wrapperRect.top + 8;
            const newLeft = cellRect.right - wrapperRect.left - 60;
            setFloatingMenu(prev => {
              if (prev.visible && prev.top === newTop && prev.left === newLeft) return prev;
              return { visible: true, top: newTop, left: newLeft, range: [r, c, r2, c2], aiMode: false };
            });
            setAiPrompt('');
          } else {
            setFloatingMenu(prev => {
              if (prev.visible && prev.top === 50 && prev.left === 100) return prev;
              return { visible: true, top: 50, left: 100, range: [r, c, r2, c2], aiMode: false };
            });
            setAiPrompt('');
          }
        }
      }, 50);
    } else {
      setFloatingMenu(prev => prev.visible === false ? prev : { visible: false, top: 0, left: 0, range: null, aiMode: false });
    }
  }, []);

  // Listen to cell selection changes to update formula bar
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const hotInstance = hotRef.current?.hotInstance;
    
    if (hotInstance) {
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
  }, [sheetData]);

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
                data={sheetData}
                rowHeaders={true}
                colHeaders={true}
                height={dimensions.height}
                width={dimensions.width}
                licenseKey="non-commercial-and-evaluation"
                contextMenu={true}
                mergeCells={true}
                customBorders={true}
                multiColumnSorting={true}
                manualRowResize={true}
                manualColumnResize={true}
                colWidths={100}
                rowHeights={24}
                autoRowSize={true}
                autoColumnSize={false}
                wordWrap={true}
                afterChange={handleAfterChange}
                afterSelectionEnd={handleSelectionEnd}
                formulas={{
                  engine: hfInstance,
                }}
                minRows={100}
                minCols={26}
                minSpareRows={1}
                minSpareCols={1}
              />
            )}
            
            {/* Floating Toolbar */}
            {floatingMenu.visible && (
              <div style={{
                position: 'absolute',
                top: floatingMenu.top,
                left: floatingMenu.left,
                zIndex: 99999,
                background: '#fff',
                border: '1px solid #ccc',
                padding: '4px',
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}>
                {floatingMenu.aiMode ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="What do you want to calculate?" 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!aiPrompt.trim() || isGeneratingFormula) return;
                          
                          setIsGeneratingFormula(true);
                          try {
                            const token = localStorage.getItem("vexius_token");
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                            
                            // Detect if user wants a table or a formula
                            const lowerPrompt = aiPrompt.toLowerCase();
                            const isTableRequest = lowerPrompt.includes('create') || lowerPrompt.includes('table') || lowerPrompt.includes('tabel') || lowerPrompt.includes('buat');
                            const actionType = isTableRequest ? 'generate_table' : 'generate_formula';

                            const res = await fetch(`${apiUrl}/ai/inline-action`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ action: actionType, text: aiPrompt })
                            });
                            
                            if (res.ok) {
                              const data = await res.json();
                              const range = floatingMenu.range;
                              const hotInst = hotRef.current?.hotInstance;
                              if (range && hotInst) {
                                const [startRow, startCol] = range;
                                const r = Math.min(startRow, range[2] ?? startRow);
                                const c = Math.min(startCol, range[3] ?? startCol);
                                
                                if (isTableRequest) {
                                  try {
                                    // The response should be a raw JSON string like '[["A", "B"], [1, 2]]'
                                    let jsonStr = data.result.trim();
                                    // In case the AI still wraps it in markdown, strip it
                                    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
                                    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```/g, '').trim();
                                    
                                    const tableData = JSON.parse(jsonStr);
                                    if (Array.isArray(tableData) && Array.isArray(tableData[0])) {
                                      hotInst.populateFromArray(r, c, tableData);
                                      
                                      // Apply beautiful borders to the generated table
                                      const customBordersPlugin = hotInst.getPlugin('customBorders');
                                      if (customBordersPlugin) {
                                        const endRow = r + tableData.length - 1;
                                        const endCol = c + tableData[0].length - 1;
                                        for (let currR = r; currR <= endRow; currR++) {
                                          for (let currC = c; currC <= endCol; currC++) {
                                            customBordersPlugin.setBorders([[currR, currC, currR, currC]], {
                                              top: { width: 1, color: '#000' },
                                              left: { width: 1, color: '#000' },
                                              bottom: { width: 1, color: '#000' },
                                              right: { width: 1, color: '#000' }
                                            });
                                          }
                                        }
                                        hotInst.render();
                                      }
                                    }
                                  } catch (parseError) {
                                    console.error("Failed to parse AI table data:", parseError);
                                    // Fallback if parsing fails, just put the raw text
                                    hotInst.setDataAtCell(r, c, data.result);
                                  }
                                } else {
                                  // Formula generation logic
                                  hotInst.setDataAtCell(r, c, data.result);
                                }
                                
                                setFloatingMenu({ ...floatingMenu, visible: false, aiMode: false });
                                setAiPrompt('');
                                window.dispatchEvent(new CustomEvent('vexius:force-save-sheet'));
                              }
                            }
                          } catch (err) {
                            console.error("AI Formula error", err);
                          } finally {
                            setIsGeneratingFormula(false);
                          }
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        outline: 'none',
                        width: '200px'
                      }}
                      autoFocus
                    />
                    {isGeneratingFormula ? (
                      <span style={{ fontSize: '12px', color: '#666', padding: '0 4px' }}>Loading...</span>
                    ) : (
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setFloatingMenu({...floatingMenu, aiMode: false}); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
                        title="Close"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const hotInstance = hotRef.current?.hotInstance;
                      if (!hotInstance) return;
                      
                      const range = floatingMenu.range;
                      if (range) {
                        const [startRow, startCol, endRow, endCol] = range;
                        const minRow = Math.min(startRow, endRow);
                        const maxRow = Math.max(startRow, endRow);
                        const minCol = Math.min(startCol, endCol);
                        const maxCol = Math.max(startCol, endCol);
                        
                        const customBordersPlugin = hotInstance.getPlugin('customBorders');
                        if (customBordersPlugin) {
                          for (let r = minRow; r <= maxRow; r++) {
                            for (let c = minCol; c <= maxCol; c++) {
                              customBordersPlugin.setBorders([[r, c, r, c]], {
                                top: { width: 1, color: '#000' },
                                left: { width: 1, color: '#000' },
                                bottom: { width: 1, color: '#000' },
                                right: { width: 1, color: '#000' }
                              });
                            }
                          }
                          for (let r = minRow; r <= maxRow; r++) {
                            for (let c = minCol; c <= maxCol; c++) {
                              let currentClass = hotInstance.getCellMeta(r, c).className || '';
                              if (currentClass.includes('ht-border-')) {
                                currentClass = currentClass.replace(/ht-border-[^\s]+/g, '').trim();
                                hotInstance.setCellMeta(r, c, 'className', currentClass);
                              }
                            }
                          }
                        }
                        hotInstance.render();
                        setFloatingMenu({ ...floatingMenu, visible: false });
                        window.dispatchEvent(new CustomEvent('vexius:force-save-sheet'));
                      }
                    }} style={{ 
                      padding: '4px 8px', 
                      background: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#374151'
                    }}>
                      <Grid size={14} color="#2563eb" /> Table
                    </button>
                    
                    <button onMouseDown={(e) => {
                      e.preventDefault(); 
                      e.stopPropagation();
                      setFloatingMenu({...floatingMenu, aiMode: true});
                    }} style={{
                      padding: '4px', 
                      background: '#eef2ff', 
                      border: '1px solid #c7d2fe', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#4f46e5'
                    }} title="AI Formula Generator">
                      <Sparkles size={14} />
                    </button>
                  </>
                )}
              </div>
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
