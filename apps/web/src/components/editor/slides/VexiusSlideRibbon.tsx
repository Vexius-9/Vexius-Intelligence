import React from 'react';
import { 
  ClipboardPaste, LayoutTemplate, LayoutGrid, Library,
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  PaintBucket, Type,
  Sparkles, CheckCircle2, Image as ImageIcon,
  Search, PanelRight, Play, MonitorPlay,
  FileText, FolderOpen, Save, Download, ChevronRight, Undo2, Redo2
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface VexiusSlideRibbonProps {
  navbarElement?: React.ReactNode;
  isCopilotVisible?: boolean;
  onFormat?: (command: string, value?: string) => void;
}

export function VexiusSlideRibbon({ navbarElement, isCopilotVisible, onFormat }: VexiusSlideRibbonProps) {
  const [activeTab, setActiveTab] = React.useState('Home');
  const [usePresenterView, setUsePresenterView] = React.useState(true);
  const [isFileMenuOpen, setIsFileMenuOpen] = React.useState(false);
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null);
  const [isAutoSave, setIsAutoSave] = React.useState(true);
  
  const toggleAutoSave = () => {
    setIsAutoSave(!isAutoSave);
    toast.success(isAutoSave ? 'AutoSave turned off' : 'AutoSave turned on');
  };

  const RibbonButton = ({ onClick, onMouseDown, isActive, children }: { onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void, isActive?: boolean, children: React.ReactNode }) => (
    <button 
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{
        padding: '6px 8px',
        borderRadius: '4px',
        border: 'none',
        background: isActive ? 'rgba(0,0,0,0.1)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? '#000' : '#4b5563',
        transition: 'background 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = isActive ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'}
      onMouseOut={(e) => e.currentTarget.style.background = isActive ? 'rgba(0,0,0,0.1)' : 'transparent'}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div style={{ width: '1px', height: '40px', background: '#e5e7eb', margin: '0 8px' }} />
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 50
    }}>
      {/* Top Navbar Context (e.g. Breadcrumbs) */}
      <div style={{ padding: '4px 8px', display: 'flex' }}>
        {navbarElement}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', padding: '0 16px', background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
          <button 
            onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              background: '#ea580c', 
              color: '#fff', 
              fontWeight: 500, 
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              height: '100%'
            }}>
            File
          </button>
          
          {isFileMenuOpen && (
            <>
              <div 
                onClick={() => { setIsFileMenuOpen(false); setActiveSubmenu(null); }} 
                style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '0 6px 6px 6px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                zIndex: 999,
                minWidth: '220px',
                display: 'flex',
                flexDirection: 'column',
                padding: '4px'
              }}>
                {[
                  { icon: <FileText size={16} />, label: 'New', action: () => alert('New Presentation') },
                  { icon: <FolderOpen size={16} />, label: 'Open', action: () => alert('Open Presentation') }
                ].map((item, idx) => (
                  <button key={idx} onClick={() => { item.action(); setIsFileMenuOpen(false); setActiveSubmenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; setActiveSubmenu(null); }} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    {item.icon} {item.label}
                  </button>
                ))}
                
                <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }}></div>
                
                {[
                  { icon: <Save size={16} />, label: 'Save', action: () => {
                    window.dispatchEvent(new CustomEvent('vexius:force-save'));
                    toast.success('Presentation saved successfully!');
                  }},
                ].map((item, idx) => (
                  <button key={idx} onClick={() => { item.action(); setIsFileMenuOpen(false); setActiveSubmenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; setActiveSubmenu(null); }} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
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
                        { label: 'Microsoft PowerPoint (.pptx)', action: () => {
                          window.dispatchEvent(new CustomEvent('vexius:download-pptx'));
                          toast.success('Preparing PowerPoint file...');
                        }},
                        { label: 'PDF Document (.pdf)', action: () => {
                          window.dispatchEvent(new CustomEvent('vexius:download-pdf'));
                          toast.success('Preparing PDF document...');
                        }},
                        { label: 'Web Page (.html)', action: () => {
                          window.dispatchEvent(new CustomEvent('vexius:download-html'));
                          toast.success('Downloading HTML...');
                        }},
                      ].map((item, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => { item.action(); setIsFileMenuOpen(false); setActiveSubmenu(null); }} 
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} 
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', marginRight: '16px' }}>
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('vexius:force-save'));
              toast.success('Presentation saved successfully!');
            }}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            title="Save"
          >
            <Save size={18} />
          </button>
          <button onClick={() => onFormat?.('undo')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Undo">
            <Undo2 size={18} />
          </button>
          <button onClick={() => onFormat?.('redo')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Redo">
            <Redo2 size={18} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div 
              onClick={toggleAutoSave}
              style={{ 
                width: '32px', height: '18px', background: isAutoSave ? '#ea580c' : '#cbd5e1', borderRadius: '9px', 
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

        {['Home', 'Insert', 'Draw', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Review', 'View'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: '8px 4px',
              border: 'none', 
              background: 'transparent',
              color: activeTab === tab ? '#ea580c' : '#4b5563',
              borderBottom: activeTab === tab ? '2px solid #ea580c' : '2px solid transparent',
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ribbon Content */}
      <div style={{ display: 'flex', padding: '8px 16px', gap: '4px', alignItems: 'center', background: '#f9fafb', minHeight: '60px', overflowX: 'auto' }}>
        
        {activeTab === 'Home' && (
          <>
            {/* Vexius AI Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', height: '100%', alignItems: 'center' }}>
                <button onClick={() => window.dispatchEvent(new CustomEvent('vexius:toggle-ai'))} style={{ 
                  border: isCopilotVisible ? '1px solid #a855f7' : '1px solid transparent',
                  background: isCopilotVisible ? '#f3e8ff' : 'transparent', 
                  borderRadius: '6px', padding: '7px', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
                }}>
                  <div style={{ padding: '4px', display: 'flex' }}>
                    <img src="/logo.png" alt="Vexius AI" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: isCopilotVisible ? '#9333ea' : '#111827', fontWeight: 500 }}>Vexius AI</span>
                </button>
              </div>
            </div>

            <Divider />

            {/* AI Tools */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
                <RibbonButton><Sparkles size={20} color="#3b82f6" /></RibbonButton>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>AI Beautify</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
                <RibbonButton><CheckCircle2 size={20} color="#3b82f6" /></RibbonButton>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>AI Fact Check</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
                <RibbonButton><ImageIcon size={20} color="#3b82f6" /></RibbonButton>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>AI Image</span>
              </div>
            </div>

            <Divider />

            {/* Clipboard */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <RibbonButton><ClipboardPaste size={20} /></RibbonButton>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>Paste</span>
            </div>

            <Divider />

            {/* Slides */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <RibbonButton><LayoutTemplate size={20} /></RibbonButton>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>New Slide</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <RibbonButton><LayoutGrid size={20} /></RibbonButton>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Layout</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <RibbonButton><Library size={20} /></RibbonButton>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Add Section</span>
              </div>
            </div>

            <Divider />

            {/* Typography */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select 
                  onChange={(e) => onFormat && onFormat('fontName', e.target.value)}
                  style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', background: '#fff' }}
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                </select>
                <select 
                  onChange={(e) => onFormat && onFormat('fontSize', e.target.value)}
                  style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', background: '#fff', width: '50px' }}
                >
                  <option value="1">10</option>
                  <option value="2">13</option>
                  <option value="3">16</option>
                  <option value="4">18</option>
                  <option value="5">24</option>
                  <option value="6">32</option>
                  <option value="7">48</option>
                </select>
                <input 
                  type="color" 
                  onChange={(e) => onFormat && onFormat('foreColor', e.target.value)}
                  style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '0', background: '#fff', width: '24px', height: '24px', cursor: 'pointer' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <RibbonButton onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat && onFormat('bold')}><Bold size={16} /></RibbonButton>
                <RibbonButton onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat && onFormat('italic')}><Italic size={16} /></RibbonButton>
                <RibbonButton onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat && onFormat('underline')}><Underline size={16} /></RibbonButton>
              </div>
            </div>

            <Divider />

            {/* Paragraph & Formatting */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
                <RibbonButton onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat && onFormat('justifyLeft')}><AlignLeft size={20} /></RibbonButton>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Left</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
                <RibbonButton onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat && onFormat('justifyCenter')}><AlignCenter size={20} /></RibbonButton>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Center</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
                <RibbonButton onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat && onFormat('justifyRight')}><AlignRight size={20} /></RibbonButton>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Right</span>
              </div>
            </div>

            <Divider />

            {/* Edit */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
              <RibbonButton><Search size={20} /></RibbonButton>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>Find/Replace</span>
            </div>
          </>
        )}
        
        {activeTab === 'Slide Show' && (
          <>
            {/* Start Slide Show */}
            <div style={{ display: 'flex', gap: '12px', paddingRight: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('vexius:start-slideshow', { detail: { fromBeginning: true, usePresenterView } }))}
                  style={{ 
                    border: '1px solid transparent',
                    background: 'transparent', 
                    borderRadius: '6px', padding: '7px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <MonitorPlay size={28} color="#ea580c" />
                  <span style={{ fontSize: '11px', color: '#111827', fontWeight: 500, textAlign: 'center', width: '70px' }}>From Beginning</span>
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('vexius:start-slideshow', { detail: { fromBeginning: false, usePresenterView } }))}
                  style={{ 
                    border: '1px solid transparent',
                    background: 'transparent', 
                    borderRadius: '6px', padding: '7px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Play size={28} color="#ea580c" />
                  <span style={{ fontSize: '11px', color: '#111827', fontWeight: 500, textAlign: 'center', width: '70px' }}>From Current Slide</span>
                </button>
              </div>
            </div>
            
            <Divider />
            
            {/* Presentation Options */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', paddingLeft: '8px' }}>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#374151' }}>
                <input 
                  type="checkbox" 
                  checked={usePresenterView} 
                  onChange={(e) => setUsePresenterView(e.target.checked)} 
                /> 
                Use Presenter View
              </label>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#6b7280' }}>
                <input type="checkbox" disabled /> Play Narrations
              </label>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
