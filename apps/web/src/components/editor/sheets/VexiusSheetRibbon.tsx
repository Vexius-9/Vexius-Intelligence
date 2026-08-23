import React from 'react';
import { 
  ClipboardPaste, ClipboardType,
  Bold, Italic, Underline, Strikethrough, PaintBucket, Type, Grid,
  AlignLeft, AlignCenter, AlignRight, Merge,
  DollarSign, Percent, MoreHorizontal,
  LayoutTemplate, Table, Brush,
  Sparkles, Wand2, Search,
  ArrowUpToLine, ArrowDownToLine, GripHorizontal,
  FileText, FolderOpen, Save, Download, ChevronRight, Printer, Share2, Undo2, Redo2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface VexiusSheetRibbonProps {
  hotInstance?: any;
  navbarElement?: React.ReactNode;
}

export function VexiusSheetRibbon({ hotInstance, navbarElement }: VexiusSheetRibbonProps) {
  const [activeTab, setActiveTab] = React.useState('Home');
  const [isFileMenuOpen, setIsFileMenuOpen] = React.useState(false);
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null);

  const toggleCellClass = (className: string) => {
    if (!hotInstance) return;
    const selected = hotInstance.getSelected();
    if (!selected) return;
    
    for (const range of selected) {
      const [startRow, startCol, endRow, endCol] = range;
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          let currentClass = hotInstance.getCellMeta(r, c).className || '';
          
          if (currentClass.includes(className)) {
            // Remove it
            currentClass = currentClass.replace(new RegExp(`\\b${className}\\b`, 'g'), '').trim();
          } else {
            // Add it (Handle mutual exclusivity for alignments)
            if (className.startsWith('ht')) {
               if (['htLeft', 'htCenter', 'htRight', 'htJustify'].includes(className)) {
                 currentClass = currentClass.replace(/\b(htLeft|htCenter|htRight|htJustify)\b/g, '');
               }
               if (['htTop', 'htMiddle', 'htBottom'].includes(className)) {
                 currentClass = currentClass.replace(/\b(htTop|htMiddle|htBottom)\b/g, '');
               }
            }
            currentClass = `${currentClass} ${className}`.trim();
          }
          
          hotInstance.setCellMeta(r, c, 'className', currentClass);
        }
      }
    }
    hotInstance.render();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('vexius:force-save-sheet'));
    }, 100);
  };

  const toggleBorders = () => {
    toggleCellClass('ht-border-all');
  };

  const [isAutoSave, setIsAutoSave] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vexius_autosave');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const toggleAutoSave = () => {
    const newState = !isAutoSave;
    setIsAutoSave(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vexius_autosave', JSON.stringify(newState));
      window.dispatchEvent(new CustomEvent('vexius:autosave-toggle-sheet', { detail: newState }));
    }
    toast.success(`AutoSave is now ${newState ? 'ON' : 'OFF'}`);
  };

  const RibbonButton = ({ onClick, isActive, children }: { onClick: (e: React.MouseEvent<HTMLButtonElement>) => void, isActive?: boolean, children: React.ReactNode }) => (
    <button 
      onClick={onClick}
      style={{
        padding: '6px 8px',
        borderRadius: '4px',
        border: 'none',
        background: isActive ? 'rgba(0,0,0,0.1)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? '#000' : '#4b5563'
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb',
      fontFamily: 'var(--font-geist-sans)',
      width: '100%',
      overflowX: 'hidden',
      flexShrink: 0
    }}>
      {/* Top Tabs */}
      <div style={{ display: 'flex', gap: '16px', padding: '4px 8px', alignItems: 'center' }}>
        
        {navbarElement}

        {/* File & Quick Actions Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', zIndex: 1000 }}>
            <button 
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              style={{ padding: '6px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}
            >
              File
            </button>
            {isFileMenuOpen && (
              <>
                <div 
                  onClick={() => setIsFileMenuOpen(false)} 
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                  zIndex: 999,
                  minWidth: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4px'
                }}>
                  {[
                    { icon: <FileText size={16} />, label: 'New', action: () => alert('New Spreadsheet') },
                    { icon: <FolderOpen size={16} />, label: 'Open', action: () => alert('Open Spreadsheet') }
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => { item.action(); setIsFileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                  
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }}></div>
                  
                  {[
                    { icon: <Save size={16} />, label: 'Save', action: () => {
                      window.dispatchEvent(new CustomEvent('vexius:force-save-sheet'));
                      toast.success('Spreadsheet saved successfully!');
                    }},
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => { item.action(); setIsFileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {item.icon} {item.label}
                    </button>
                  ))}

                  <div 
                    onMouseEnter={() => setActiveSubmenu('download')}
                    onMouseLeave={() => setActiveSubmenu(null)}
                    style={{ position: 'relative' }}
                  >
                    <button 
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: activeSubmenu === 'download' ? '#f1f5f9' : 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }}
                    >
                      <Download size={16} /> Download
                      <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
                    </button>
                    {activeSubmenu === 'download' && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '100%',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        minWidth: '240px',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '4px',
                        zIndex: 1000,
                        marginLeft: '4px'
                      }}>
                        {[
                          { label: 'Microsoft Excel (.xlsx)', action: () => alert('Download XLSX') },
                          { label: 'Dokumen PDF (.pdf)', action: () => window.print() },
                          { label: 'Comma Separated Values (.csv)', action: () => alert('Download CSV') }
                        ].map((subitem, sidx) => (
                          <button key={sidx} onClick={() => { subitem.action(); setIsFileMenuOpen(false); setActiveSubmenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            {subitem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }}></div>

                  {[
                    { icon: <Printer size={16} />, label: 'Print', action: () => window.print() },
                    { icon: <Share2 size={16} />, label: 'Share', action: () => alert('Share Dialog') }
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => { item.action(); setIsFileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('vexius:force-save-sheet'));
                toast.success('Spreadsheet saved successfully!');
              }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              title="Save"
            >
              <Save size={18} />
            </button>
            <button onClick={() => hotInstance?.undo()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Undo">
              <Undo2 size={18} />
            </button>
            <button onClick={() => hotInstance?.redo()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Redo">
              <Redo2 size={18} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                onClick={toggleAutoSave}
                style={{ 
                  width: '32px', height: '18px', background: isAutoSave ? '#10b981' : '#cbd5e1', borderRadius: '9px', 
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                }}>
                <div style={{ 
                  width: '14px', height: '14px', background: '#fff', borderRadius: '50%', 
                  position: 'absolute', top: '2px', right: isAutoSave ? '2px' : '16px',
                  transition: 'right 0.2s'
                }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 500 }}>AutoSave</span>
            </div>
          </div>

          <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />

          {/* Tab Headers */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? '#10b981' : '#4b5563',
                  borderBottom: activeTab === tab ? '2px solid #10b981' : '2px solid transparent'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '8px', display: 'flex', gap: '16px', minHeight: '84px', overflowX: 'auto', background: '#ffffff', borderTop: '1px solid #f3f4f6' }}>
        
        {activeTab === 'Home' && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
            
            {/* AI Group */}
            <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <button onClick={() => window.dispatchEvent(new CustomEvent('vexius:toggle-ai'))} style={{ 
                border: 'none', background: '#ecfdf5', borderRadius: '6px', padding: '8px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <div style={{ padding: '4px', display: 'flex' }}>
                  <img src="/logo.png" alt="Vexius AI" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>Vexius AI</span>
              </button>
              
              <button onClick={() => {
                window.dispatchEvent(new CustomEvent('vexius:toggle-ai'));
                setTimeout(() => window.dispatchEvent(new CustomEvent('vexius:ai-action', { detail: 'check' })), 100);
              }} style={{ 
                border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <Search size={24} color="#10b981" />
                <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>AI Check</span>
              </button>
              
              <button onClick={() => {
                window.dispatchEvent(new CustomEvent('vexius:toggle-ai'));
                setTimeout(() => window.dispatchEvent(new CustomEvent('vexius:ai-action', { detail: 'analyze' })), 100);
              }} style={{ 
                border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <Sparkles size={24} color="#10b981" />
                <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>AI Analyze</span>
              </button>
            </div>

            {/* Clipboard Group */}
            <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <button onClick={() => {}} style={{ 
                border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <ClipboardPaste size={24} color="#4b5563" />
                <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>Paste</span>
              </button>
              
              <button onClick={() => {}} style={{ 
                border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
              }}>
                <ClipboardType size={24} color="#4b5563" />
                <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>Paste Special</span>
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '4px' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <Brush size={16} />
                </RibbonButton>
              </div>
            </div>

            {/* Font Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', width: '130px' }}>
                  <option value="Calibri">Calibri</option>
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                </select>
                <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', width: '60px' }}>
                  <option value="11">11</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                </select>
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A<span style={{ fontSize: '0.7rem' }}>↑</span></span>
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A<span style={{ fontSize: '0.7rem' }}>↓</span></span>
                </RibbonButton>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => toggleCellClass('ht-bold')} isActive={false}>
                  <span style={{ fontWeight: 700, fontFamily: 'serif', fontSize: '1rem', width: '16px', textAlign: 'center' }}>B</span>
                </RibbonButton>
                <RibbonButton onClick={() => toggleCellClass('ht-italic')} isActive={false}>
                  <span style={{ fontStyle: 'italic', fontFamily: 'serif', fontSize: '1rem', width: '16px', textAlign: 'center' }}>I</span>
                </RibbonButton>
                <RibbonButton onClick={() => toggleCellClass('ht-underline')} isActive={false}>
                  <span style={{ textDecoration: 'underline', fontFamily: 'serif', fontSize: '1rem', width: '16px', textAlign: 'center' }}>U</span>
                </RibbonButton>
                <RibbonButton onClick={() => toggleCellClass('ht-strike')} isActive={false}>
                  <span style={{ textDecoration: 'line-through', fontSize: '1rem', width: '18px', textAlign: 'center' }}>ab</span>
                </RibbonButton>
                
                <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RibbonButton onClick={() => {}} isActive={false}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: '14px' }}>A</span>
                      <div style={{ width: '14px', height: '3px', background: '#ff0000', marginTop: '2px' }} />
                    </div>
                  </RibbonButton>
                  <span style={{ fontSize: '0.5rem', marginLeft: '2px', color: '#6b7280' }}>▼</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RibbonButton onClick={() => {}} isActive={false}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <PaintBucket size={14} />
                      <div style={{ width: '14px', height: '3px', background: '#ffff00', marginTop: '2px' }} />
                    </div>
                  </RibbonButton>
                  <span style={{ fontSize: '0.5rem', marginLeft: '2px', color: '#6b7280' }}>▼</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RibbonButton onClick={toggleBorders} isActive={false}>
                    <Grid size={16} />
                    <span style={{ fontSize: '0.5rem', marginLeft: '4px' }}>Borders</span>
                  </RibbonButton>
                </div>
              </div>
            </div>

            {/* Alignment Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => toggleCellClass('htTop')} isActive={false}>
                  <ArrowUpToLine size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => toggleCellClass('htMiddle')} isActive={false}>
                  <GripHorizontal size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => toggleCellClass('htBottom')} isActive={false}>
                  <ArrowDownToLine size={16} />
                </RibbonButton>
                
                <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>ab</span>
                </RibbonButton>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => toggleCellClass('htLeft')} isActive={false}>
                  <AlignLeft size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => toggleCellClass('htCenter')} isActive={false}>
                  <AlignCenter size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => toggleCellClass('htRight')} isActive={false}>
                  <AlignRight size={16} />
                </RibbonButton>
                
                <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <Merge size={16} />
                  <span style={{ fontSize: '0.75rem', marginLeft: '4px', fontWeight: 500 }}>Merge ▼</span>
                </RibbonButton>
              </div>
            </div>

            {/* Number Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', width: '140px' }}>
                  <option value="General">General</option>
                  <option value="Number">Number</option>
                  <option value="Currency">Currency</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <DollarSign size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <Percent size={16} />
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', padding: '0 2px' }}>,</span>
                </RibbonButton>
                
                <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>.0+</span>
                </RibbonButton>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>.0-</span>
                </RibbonButton>
              </div>
            </div>

            {/* Styles Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LayoutTemplate size={16} color="#2563eb" />
                    <span style={{ fontSize: '0.75rem' }}>Conditional Formatting ▼</span>
                  </div>
                </RibbonButton>
                
                <RibbonButton onClick={() => {}} isActive={false}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Table size={16} color="#2563eb" />
                    <span style={{ fontSize: '0.75rem' }}>Format as Table ▼</span>
                  </div>
                </RibbonButton>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <RibbonButton onClick={() => {}} isActive={false}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Grid size={16} color="#2563eb" />
                    <span style={{ fontSize: '0.75rem' }}>Cell Styles ▼</span>
                  </div>
                </RibbonButton>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
