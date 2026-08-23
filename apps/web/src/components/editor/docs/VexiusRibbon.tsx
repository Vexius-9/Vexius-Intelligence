import React from 'react';
import { 
  FileText, Home, Undo2, Redo2, Printer,
  Bold, Italic, Underline, Strikethrough, Subscript as SubIcon, Superscript as SupIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Indent, Outdent,
  List, ListOrdered, CheckSquare, Palette, Highlighter, RemoveFormatting,
  Table as TableIcon, Image as ImageIcon, Link as LinkIcon, Quote, Minus, Code, SquareCode,
  Video, CornerDownLeft, Grid, Trash2, Bot, Save, Wand2,
  ShieldCheck, Clock, Share2, FolderOpen, Info
} from 'lucide-react';
import { Editor } from '@tiptap/react';

export interface VexiusRibbonProps {
  editor: Editor | null;
  navbarElement?: React.ReactNode;
  isCopilotVisible?: boolean;
}

export function VexiusRibbon({ editor, navbarElement, isCopilotVisible = false }: VexiusRibbonProps) {
  const [activeTab, setActiveTab] = React.useState('Home');
  const [isFileMenuOpen, setIsFileMenuOpen] = React.useState(false);
  const [activeFileMenuTab, setActiveFileMenuTab] = React.useState('Info');

  if (!editor) {
    return <div style={{ height: '120px', borderBottom: '1px solid var(--border-color)' }}></div>;
  }

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
      position: 'relative',
      zIndex: 50
    }}>
      {/* Top Tabs */}
      <div style={{ display: 'flex', gap: '16px', padding: '4px 8px', alignItems: 'center' }}>
        
        {navbarElement}

        {/* File & Quick Actions Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', zIndex: 1000 }}>
            <button 
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              style={{ padding: '6px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}
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
                    { icon: <FileText size={16} />, label: 'New', action: () => alert('New Document') },
                    { icon: <FolderOpen size={16} />, label: 'Open', action: () => alert('Open Document') }
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => { item.action(); setIsFileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                  
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }}></div>
                  
                  {[
                    { icon: <Save size={16} />, label: 'Save', action: () => alert('Document saved successfully!') },
                    { icon: <Save size={16} />, label: 'Save As...', action: () => alert('Save As Dialog') }
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => { item.action(); setIsFileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {item.icon} {item.label}
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }}></div>

                  {[
                    { icon: <Printer size={16} />, label: 'Print', action: () => window.print() },
                    { icon: <Share2 size={16} />, label: 'Share', action: () => alert('Share Dialog') }
                  ].map((item, idx) => (
                    <button key={idx} onClick={() => { item.action(); setIsFileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.9rem', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {item.icon} {item.label}
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }}></div>

                  {[
                    { icon: <Code size={16} />, label: 'Export as HTML', action: () => {
                        const blob = new Blob([editor.getHTML()], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'document.html';
                        a.click();
                        URL.revokeObjectURL(url);
                    }},
                    { icon: <FileText size={16} />, label: 'Export as TXT', action: () => {
                        const blob = new Blob([editor.getText()], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'document.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
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
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Save">
              <Save size={18} />
            </button>
            <button onClick={() => editor.chain().focus().undo().run()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Undo">
              <Undo2 size={18} />
            </button>
            <button onClick={() => editor.chain().focus().redo().run()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Redo">
              <Redo2 size={18} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '32px', height: '18px', background: '#2563eb', borderRadius: '9px', 
                position: 'relative', cursor: 'pointer' 
              }}>
                <div style={{ 
                  width: '14px', height: '14px', background: '#fff', borderRadius: '50%', 
                  position: 'absolute', top: '2px', right: '2px' 
                }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 500 }}>AutoSave</span>
            </div>
          </div>
        </div>

        {/* Other Tabs */}
        <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
          {['Home', 'Insert', 'Draw', 'Design', 'Layout', 'References', 'Review', 'View'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '6px 16px', 
                background: activeTab === tab ? '#fff' : 'transparent', 
                color: activeTab === tab ? '#111827' : '#4b5563', 
                border: 'none', 
                borderRadius: '4px', 
                fontSize: '0.85rem', 
                fontWeight: activeTab === tab ? 600 : 500, 
                cursor: 'pointer', 
                boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' 
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar Groups */}
      <div style={{ display: 'flex', padding: '8px 16px', gap: '16px', background: '#fff', overflowX: 'auto' }}>
        
        {activeTab === 'Home' && (
          <>
            {/* AI Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
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
            
            <button onClick={() => {
              window.dispatchEvent(new CustomEvent('vexius:toggle-ai'));
              setTimeout(() => window.dispatchEvent(new CustomEvent('vexius:ai-action', { detail: 'summarize' })), 100);
            }} style={{ 
              border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
            }}>
              <FileText size={24} color="#2563eb" />
              <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>AI Summarize</span>
            </button>
            
            <button onClick={() => {
              window.dispatchEvent(new CustomEvent('vexius:toggle-ai'));
              setTimeout(() => window.dispatchEvent(new CustomEvent('vexius:ai-action', { detail: 'polish' })), 100);
            }} style={{ 
              border: 'none', background: 'transparent', borderRadius: '6px', padding: '8px 4px', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' 
            }}>
              <Wand2 size={24} color="#2563eb" />
              <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>AI Polish</span>
            </button>

          </div>
        </div>

        {/* Font Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
          {/* Top Row */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <select 
              onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()} 
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', width: '130px' }}
            >
              <option value="Calibri">Calibri (Body)</option>
              <option value="Inter">Inter</option>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Garamond">Garamond</option>
              <option value="Verdana">Verdana</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Courier New">Courier New</option>
              <option value="Monaco">Monaco</option>
              <option value="Impact">Impact</option>
            </select>
            <select 
              onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()} 
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', width: '60px' }}
            >
              <option value="11px">11</option>
              <option value="12px">12</option>
              <option value="14px">14</option>
              <option value="16px">16</option>
              <option value="24px">24</option>
            </select>
            
            <RibbonButton onClick={() => {
              const currentSize = editor.getAttributes('textStyle').fontSize || '11px';
              const sizeInt = parseInt(currentSize);
              if (!isNaN(sizeInt)) {
                editor.chain().focus().setFontSize(`${sizeInt + 1}px`).run();
              }
            }} isActive={false}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A<span style={{ fontSize: '0.7rem' }}>↑</span></span>
            </RibbonButton>
            <RibbonButton onClick={() => {
              const currentSize = editor.getAttributes('textStyle').fontSize || '11px';
              const sizeInt = parseInt(currentSize);
              if (!isNaN(sizeInt) && sizeInt > 1) {
                editor.chain().focus().setFontSize(`${sizeInt - 1}px`).run();
              }
            }} isActive={false}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A<span style={{ fontSize: '0.7rem' }}>↓</span></span>
            </RibbonButton>
            
            <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
            
            <RibbonButton onClick={() => {
              const { from, to } = editor.state.selection;
              if (from === to) return;
              const text = editor.state.doc.textBetween(from, to);
              const isUpper = text === text.toUpperCase();
              const newText = isUpper ? text.toLowerCase() : text.toUpperCase();
              editor.chain().focus().insertContent(newText).run();
            }} isActive={false}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Aa</span>
              <span style={{ fontSize: '0.5rem', marginLeft: '2px' }}>▼</span>
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} isActive={false}>
              <RemoveFormatting size={16} />
            </RibbonButton>
          </div>
          
          {/* Bottom Row */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <RibbonButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
              <span style={{ fontWeight: 700, fontFamily: 'serif', fontSize: '1rem', width: '16px', textAlign: 'center' }}>B</span>
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
              <span style={{ fontStyle: 'italic', fontFamily: 'serif', fontSize: '1rem', width: '16px', textAlign: 'center' }}>I</span>
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
              <span style={{ textDecoration: 'underline', fontFamily: 'serif', fontSize: '1rem', width: '16px', textAlign: 'center' }}>U</span>
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
              <span style={{ textDecoration: 'line-through', fontSize: '1rem', width: '18px', textAlign: 'center' }}>ab</span>
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')}>
              <span style={{ fontSize: '0.9rem' }}>x<sub style={{ fontSize: '0.6rem' }}>2</sub></span>
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')}>
              <span style={{ fontSize: '0.9rem' }}>x<sup style={{ fontSize: '0.6rem' }}>2</sup></span>
            </RibbonButton>
            
            <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
            
            {/* Highlight Color */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <RibbonButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Highlighter size={14} />
                  <div style={{ width: '14px', height: '3px', background: '#ffff00', marginTop: '2px' }} />
                </div>
                <span style={{ fontSize: '0.5rem', marginLeft: '4px' }}>▼</span>
              </RibbonButton>
              <input 
                type="color" 
                onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </div>

            {/* Text Color */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <RibbonButton onClick={(e) => {
                const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                input?.click();
              }} isActive={editor.isActive('textStyle', { color: true })}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: '14px' }}>A</span>
                  <div style={{ width: '14px', height: '3px', background: '#ff0000', marginTop: '2px' }} />
                </div>
                <span style={{ fontSize: '0.5rem', marginLeft: '4px' }}>▼</span>
              </RibbonButton>
              <input 
                type="color" 
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>
          
          <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', marginTop: '2px' }}>Font</div>
        </div>

        {/* Paragraph Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
          {/* Top Row */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: editor.isActive('bulletList') ? 'rgba(0,0,0,0.1)' : 'transparent', borderRadius: '4px' }}>
              <RibbonButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
                <List size={16} />
              </RibbonButton>
              <select onChange={(e) => {
                  if (!editor.isActive('bulletList')) editor.chain().focus().toggleBulletList().run();
                  editor.chain().focus().updateAttributes('bulletList', { listStyleType: e.target.value }).run();
                }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '10px', padding: '0', width: '16px', appearance: 'none', color: '#4b5563' }}
              >
                <option value="disc">●</option><option value="circle">○</option><option value="square">■</option>
              </select>
              <span style={{ fontSize: '0.5rem', pointerEvents: 'none', marginLeft: '-12px', marginRight: '4px', color: '#6b7280' }}>▼</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', background: editor.isActive('orderedList') ? 'rgba(0,0,0,0.1)' : 'transparent', borderRadius: '4px' }}>
              <RibbonButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
                <ListOrdered size={16} />
              </RibbonButton>
              <select onChange={(e) => {
                  if (!editor.isActive('orderedList')) editor.chain().focus().toggleOrderedList().run();
                  editor.chain().focus().updateAttributes('orderedList', { listStyleType: e.target.value }).run();
                }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '10px', padding: '0', width: '16px', appearance: 'none', color: '#4b5563' }}
              >
                <option value="decimal">1</option><option value="lower-alpha">a</option><option value="upper-alpha">A</option><option value="lower-roman">i</option><option value="upper-roman">I</option>
              </select>
              <span style={{ fontSize: '0.5rem', pointerEvents: 'none', marginLeft: '-12px', marginRight: '4px', color: '#6b7280' }}>▼</span>
            </div>

            <RibbonButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}>
              <CheckSquare size={16} />
            </RibbonButton>
            
            <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
            
            <RibbonButton onClick={() => editor.chain().focus().outdent().run()} isActive={false}>
              <Outdent size={16} />
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().indent().run()} isActive={false}>
              <Indent size={16} />
            </RibbonButton>
            
            <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
            
            <RibbonButton onClick={() => {
              alert('Advanced sorting will be available in a future update.');
            }} isActive={false}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '8px' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>A</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>Z</span>
                </div>
                <span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>↓</span>
              </div>
            </RibbonButton>
            <RibbonButton onClick={() => {
              const body = document.querySelector('.ProseMirror');
              if (body) body.classList.toggle('show-paragraph-marks');
            }} isActive={false}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1 }}>¶</span>
            </RibbonButton>
          </div>
          
          {/* Bottom Row */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <RibbonButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}>
              <AlignLeft size={16} />
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}>
              <AlignCenter size={16} />
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}>
              <AlignRight size={16} />
            </RibbonButton>
            <RibbonButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })}>
              <AlignJustify size={16} />
            </RibbonButton>
            
            <div style={{ width: '1px', background: '#e5e7eb', height: '16px', margin: '0 4px' }} />
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <RibbonButton onClick={() => editor.chain().focus().setLineHeight('1.15').run()} isActive={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.5rem', lineHeight: '6px' }}><span>↑</span><span>↓</span></div>
                  <AlignLeft size={12} />
                </div>
              </RibbonButton>
              <select onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0', width: '12px', appearance: 'none', color: '#4b5563' }}>
                <option value="1.0">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2.0">2.0</option>
              </select>
              <span style={{ fontSize: '0.5rem', pointerEvents: 'none', marginLeft: '-8px', color: '#6b7280' }}>▼</span>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <RibbonButton onClick={(e) => {
                const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                input?.click();
              }} isActive={false}>
                <Palette size={16} />
                <span style={{ fontSize: '0.5rem', marginLeft: '2px', color: '#6b7280' }}>▼</span>
              </RibbonButton>
              <input 
                type="color" 
                onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </div>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <RibbonButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} isActive={editor.isActive('table')}>
                <Grid size={16} />
              </RibbonButton>
              <span style={{ fontSize: '0.5rem', marginLeft: '2px', color: '#6b7280' }}>▼</span>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', marginTop: '2px' }}>Paragraph</div>
        </div>

        {/* Styles Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
          <div style={{ display: 'flex', gap: '4px', height: '100%', alignItems: 'center', padding: '2px 0' }}>
            <button onClick={() => editor.chain().focus().setParagraph().run()} style={{ border: editor.isActive('paragraph') && !editor.isActive('heading') ? '1px solid #93c5fd' : '1px solid transparent', background: editor.isActive('paragraph') && !editor.isActive('heading') ? '#eff6ff' : 'transparent', borderRadius: '4px', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '64px', height: '100%', justifyContent: 'center' }}>
              <span style={{ fontSize: '1rem', color: '#111827' }}>AaBb</span>
              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Normal</span>
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={{ border: editor.isActive('heading', { level: 1 }) ? '1px solid #93c5fd' : '1px solid transparent', background: editor.isActive('heading', { level: 1 }) ? '#eff6ff' : 'transparent', borderRadius: '4px', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '64px', height: '100%', justifyContent: 'center' }}>
              <span style={{ fontSize: '1rem', color: '#1d4ed8' }}>AaBb</span>
              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Heading 1</span>
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={{ border: editor.isActive('heading', { level: 2 }) ? '1px solid #93c5fd' : '1px solid transparent', background: editor.isActive('heading', { level: 2 }) ? '#eff6ff' : 'transparent', borderRadius: '4px', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '64px', height: '100%', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#1d4ed8' }}>AaBb</span>
              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Heading 2</span>
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={{ border: editor.isActive('heading', { level: 3 }) ? '1px solid #93c5fd' : '1px solid transparent', background: editor.isActive('heading', { level: 3 }) ? '#eff6ff' : 'transparent', borderRadius: '4px', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '64px', height: '100%', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#1d4ed8' }}>AaBb</span>
              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Heading 3</span>
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} style={{ border: editor.isActive('heading', { level: 4 }) ? '1px solid #93c5fd' : '1px solid transparent', background: editor.isActive('heading', { level: 4 }) ? '#eff6ff' : 'transparent', borderRadius: '4px', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '64px', height: '100%', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#1d4ed8' }}>AaBb</span>
              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Heading 4</span>
            </button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={{ border: editor.isActive('blockquote') ? '1px solid #93c5fd' : '1px solid transparent', background: editor.isActive('blockquote') ? '#eff6ff' : 'transparent', borderRadius: '4px', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '64px', height: '100%', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#4b5563', fontStyle: 'italic', borderLeft: '2px solid #9ca3af', paddingLeft: '4px' }}>AaBb</span>
              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Quote</span>
            </button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} style={{ border: editor.isActive('codeBlock') ? '1px solid #93c5fd' : '1px solid transparent', background: editor.isActive('codeBlock') ? '#eff6ff' : 'transparent', borderRadius: '4px', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '64px', height: '100%', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#059669', fontFamily: 'monospace' }}>AaBb</span>
              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Code</span>
            </button>
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', marginTop: 'auto' }}>Styles</div>
        </div>
          </>
        )}

        {activeTab === 'Insert' && (
          <>
            {/* Insert Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '16px' }}>
          <div style={{ display: 'flex', gap: '4px', height: '100%', alignItems: 'center' }}>
            <RibbonButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <TableIcon size={24} color="#2563eb" />
                <span style={{ fontSize: '0.7rem' }}>Table</span>
              </div>
            </RibbonButton>
            <RibbonButton onClick={() => {
              const url = window.prompt('URL:');
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <ImageIcon size={24} color="#059669" />
                <span style={{ fontSize: '0.7rem' }}>Image</span>
              </div>
            </RibbonButton>
            <RibbonButton onClick={() => {
              const previousUrl = editor.getAttributes('link').href;
              const url = window.prompt('URL', previousUrl);
              if (url === null) return;
              if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <LinkIcon size={24} color="#8b5cf6" />
                <span style={{ fontSize: '0.7rem' }}>Link</span>
              </div>
            </RibbonButton>
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', marginTop: 'auto' }}>Insert</div>
        </div>
          </>
        )}

        {editor.isActive('table') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', height: '100%', alignItems: 'center', padding: '4px', background: '#f3f4f6', borderRadius: '4px' }}>
              <select 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'addRowBefore') editor.chain().focus().addRowBefore().run();
                  if (val === 'addRowAfter') editor.chain().focus().addRowAfter().run();
                  if (val === 'deleteRow') editor.chain().focus().deleteRow().run();
                  if (val === 'addColumnBefore') editor.chain().focus().addColumnBefore().run();
                  if (val === 'addColumnAfter') editor.chain().focus().addColumnAfter().run();
                  if (val === 'deleteColumn') editor.chain().focus().deleteColumn().run();
                  if (val === 'deleteTable') editor.chain().focus().deleteTable().run();
                  e.target.value = '';
                }}
                style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem' }}
              >
                <option value="">Table Tools...</option>
                <option value="addRowBefore">Insert Row Above</option>
                <option value="addRowAfter">Insert Row Below</option>
                <option value="deleteRow">Delete Row</option>
                <option value="addColumnBefore">Insert Column Left</option>
                <option value="addColumnAfter">Insert Column Right</option>
                <option value="deleteColumn">Delete Column</option>
                <option value="deleteTable">Delete Table</option>
              </select>
            </div>
            <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', marginTop: 'auto' }}>Table Tools</div>
          </div>
        )}

      </div>

    </div>
  );
}
