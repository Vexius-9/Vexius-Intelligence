import React, { forwardRef, useImperativeHandle, useEffect, useState, useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Image } from '@tiptap/extension-image';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { FontSize } from './extensions/FontSize';
import { LineHeight } from './extensions/LineHeight';
import { Indent } from './extensions/Indent';
import { CustomBulletList } from './extensions/CustomBulletList';
import { CustomOrderedList } from './extensions/CustomOrderedList';
import Youtube from '@tiptap/extension-youtube';
import CharacterCount from '@tiptap/extension-character-count';
import { PaginationPlus } from 'tiptap-pagination-plus';
import { VexiusRibbon } from './VexiusRibbon';
import { Maximize, Minimize, Sparkles, Wand2, Type, AlignLeft, CheckCircle2, Check, X, CopyPlus, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface VexiusTiptapEditorProps {
  documentId: string;
  initialContent?: any;
  onUpdate?: (content: string) => void;
  sidebar?: React.ReactNode;
  navbarElement?: React.ReactNode;
  documentName?: string;
}

export interface VexiusTiptapEditorRef {
  getCurrentSelection: () => string;
  getFullText: () => string;
  applyAction: (text: string) => void;
  getEditorInstance: () => any;
}

// We will generate the extensions array per component instance to avoid sharing
// extension instances (like Link.configure()) across different editor instances.

/**
 * Recursively sanitize ProseMirror JSON to remove empty text nodes
 * which are not allowed and cause a RangeError in Tiptap/ProseMirror.
 */
function sanitizeContent(node: any): any {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(sanitizeContent);

  // Filter out text nodes with empty string content
  if (node.content && Array.isArray(node.content)) {
    const cleanedChildren = node.content
      .map(sanitizeContent)
      .filter((child: any) => {
        // Remove text nodes with empty string
        if (child.type === 'text' && (!child.text || child.text === '')) return false;
        return true;
      });
    return { ...node, content: cleanedChildren };
  }

  return node;
}

export const VexiusTiptapEditor = forwardRef<VexiusTiptapEditorRef, VexiusTiptapEditorProps>(({ documentId, initialContent, onUpdate, sidebar, navbarElement, documentName }, ref) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopilotVisible, setIsCopilotVisible] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Stable ref for onUpdate to avoid recreating the editor on prop change
  const onUpdateRef = React.useRef(onUpdate);
  React.useLayoutEffect(() => { onUpdateRef.current = onUpdate; });

  // AI Inline State
  const [showRewriteInput, setShowRewriteInput] = useState(false);
  const [rewriteContext, setRewriteContext] = useState('');

  useEffect(() => {
    const handleToggleAI = () => setIsCopilotVisible(prev => !prev);
    const handleFullscreen = (e: any) => setIsFullscreen(e.detail);
    window.addEventListener('vexius:toggle-ai', handleToggleAI);
    window.addEventListener('vexius:fullscreen', handleFullscreen);
    return () => {
      window.removeEventListener('vexius:toggle-ai', handleToggleAI);
      window.removeEventListener('vexius:fullscreen', handleFullscreen);
    };
  }, []);

  const handleInlineAIAction = (action: 'rewrite' | 'grammar' | 'summarize') => {
    if (!editor) return;
    
    if (action === 'rewrite' && !showRewriteInput) {
      setShowRewriteInput(true);
      return;
    }

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    if (!text || text.trim() === '') {
      toast.error('Please select some text first.');
      return;
    }

    // Dispatch event to AICopilot
    window.dispatchEvent(new CustomEvent('vexius:inline-ai-action', {
      detail: { action, text, context: rewriteContext }
    }));

    // Reset floating menu state
    setShowRewriteInput(false);
    setRewriteContext('');
    
    // Automatically open AI sidebar if it's not open
    if (!isCopilotVisible) {
      setIsCopilotVisible(true);
    }
  };
  // ─── Direct Editor Instantiation ────────────────────────────────────────────
  // We bypass useEditor entirely because Tiptap v3's useEditor hook internally
  // calls refreshEditorInstance when any option changes, causing the
  // 'Adding different instances of a keyed plugin' ProseMirror RangeError.
  // Using new Editor() in a useEffect gives us 100% control over lifecycle.
  const editorRef = useRef<Editor | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    let instance: Editor | null = null;
    try {
      instance = new Editor({
        extensions: [
          StarterKit.configure({
            bulletList: false,
            orderedList: false,
            link: { openOnClick: false },
          }),
          CustomBulletList,
          CustomOrderedList,
          TextAlign.configure({ types: ['heading', 'paragraph'] }),
          TextStyle,
          Color,
          FontFamily,
          Highlight.configure({ multicolor: true }),
          Table.configure({ resizable: true }),
          TableRow,
          TableHeader,
          TableCell,
          Subscript,
          Superscript,
          Image,
          TaskList,
          TaskItem.configure({ nested: true }),
          FontSize,
          LineHeight,
          Indent,
          Youtube.configure({ controls: false }),
          CharacterCount,
          PaginationPlus.configure({
            pageHeight: 1123, // A4 height at 96 DPI
            pageWidth: 794,   // A4 width at 96 DPI
            pageGap: 40,
            marginTop: 96,
            marginBottom: 96,
            marginLeft: 96,
            marginRight: 96,
            footerRight: '',
            footerLeft: '',
            headerRight: '',
            headerLeft: '',
          }),
        ],
        content: sanitizeContent(initialContent) || '',
        onUpdate: ({ editor: e }) => {
          if (onUpdateRef.current) onUpdateRef.current(e.getHTML());
        },
        onTransaction: ({ editor: e }) => {
          const pages = e.view.dom.querySelectorAll('.rm-page-break');
          if (pages.length > 0) {
            setPageCount(prev => prev !== pages.length ? pages.length : prev);
          }
        },
        editorProps: {
          attributes: {
            class: 'vexius-tiptap-paper prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none max-w-none',
            style: 'background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); min-height: 1123px; margin: 0 auto; border: none;'
          },
        },
      });

      editorRef.current = instance;
      setEditor(instance);
    } catch (err) {
      console.error('Failed to initialize Tiptap Editor:', err);
    }

    setIsMounted(true);

    return () => {
      if (instance) {
        instance.destroy();
      }
      editorRef.current = null;
      setEditor(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount — never recreate the editor

  useImperativeHandle(ref, () => ({
    getCurrentSelection: () => {
      if (!editor) return "";
      const { from, to } = editor.state.selection;
      return editor.state.doc.textBetween(from, to, ' ');
    },
    getFullText: () => {
      if (!editor) return "";
      return editor.getText();
    },
    applyAction: (text: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(text).run();
    },
    getEditorInstance: () => editor
  }));

  if (!isMounted) return null;

  return (
    <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        background: '#e5e7eb'
      }}>
      <div style={{ zIndex: 9999, position: 'relative' }}>
        <VexiusRibbon editor={editor} navbarElement={navbarElement} isCopilotVisible={isCopilotVisible} />
      </div>
      
      {/* Editor Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
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

        {/* Scrollable Canvas */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '40px 0', 
          display: 'flex', 
          justifyContent: 'center', 
          position: 'relative'
        }}>
          
          {/* Fullscreen Toggle */}
        <button
          onClick={() => {
          const newState = !isFullscreen;
          setIsFullscreen(newState);
          window.dispatchEvent(new CustomEvent('vexius:fullscreen', { detail: newState }));
        }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4b5563'
          }}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>

        <style>{`
          .ProseMirror.rm-with-pagination {
            border: none !important;
          }
          .rm-pagination-gap {
            background: #e5e7eb !important;
            border: none !important;
            z-index: 10 !important;
            position: relative;
          }
        `}</style>

        <div style={{
          background: 'transparent',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          outline: 'none',
          marginBottom: '40px',
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.1s ease-out'
        }}>
          {editor && (
            <BubbleMenu 
              editor={editor}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                padding: '4px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                gap: '4px',
                minWidth: '240px'
              }}
            >
              <style>{`
                .ai-bubble-btn {
                  padding: 6px 8px;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  font-size: 13px;
                  transition: all 0.15s ease;
                }
                .ai-bubble-btn.rewrite {
                  background: rgba(168, 85, 247, 0.1);
                  color: #a855f7;
                  font-weight: 500;
                }
                .ai-bubble-btn.rewrite:hover {
                  background: rgba(168, 85, 247, 0.2);
                }
                .ai-bubble-btn.rewrite:active {
                  background: rgba(168, 85, 247, 0.3);
                  transform: scale(0.96);
                }
                
                .ai-bubble-btn.standard {
                  background: transparent;
                  color: #4b5563;
                }
                .ai-bubble-btn.standard:hover {
                  background: #f3f4f6;
                  color: #111827;
                }
                .ai-bubble-btn.standard:active {
                  background: #e5e7eb;
                  transform: scale(0.96);
                }
              `}</style>
              {showRewriteInput ? (
                <div style={{ display: 'flex', gap: '4px', padding: '4px' }}>
                  <input 
                    type="text" 
                    value={rewriteContext}
                    onChange={(e) => setRewriteContext(e.target.value)}
                    placeholder="E.g. Make it more formal..."
                    style={{ flex: 1, padding: '4px 8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '4px', outline: 'none' }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInlineAIAction('rewrite');
                      if (e.key === 'Escape') setShowRewriteInput(false);
                    }}
                  />
                  <button onClick={() => handleInlineAIAction('rewrite')} style={{ padding: '4px 8px', background: '#a855f7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                    <Send size={14} />
                  </button>
                  <button onClick={() => setShowRewriteInput(false)} style={{ padding: '4px 8px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="ai-bubble-btn standard" onClick={() => handleInlineAIAction('rewrite')}>
                    <Wand2 size={14} /> Rewrite
                  </button>
                  <button className="ai-bubble-btn standard" onClick={() => handleInlineAIAction('grammar')}>
                    <CheckCircle2 size={14} /> Grammar
                  </button>
                  <button className="ai-bubble-btn standard" onClick={() => handleInlineAIAction('summarize')}>
                    <AlignLeft size={14} /> Summarize
                  </button>
                </div>
              )}
            </BubbleMenu>
          )}
          <EditorContent editor={editor} />
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
        {/* Left Side */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>Page 1 of {pageCount}</span>
          <span>{editor?.storage?.characterCount?.words() ?? 0} words</span>
          <span>— Opened {documentName ? documentName + '.docx' : 'document.docx'}</span>
        </div>
        
        {/* Right Side */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            onChange={(e) => setZoomLevel(Number(e.target.value))} 
            style={{ width: '80px', cursor: 'pointer', accentColor: '#9ca3af' }} 
          />
          <button 
            onClick={() => setZoomLevel(z => Math.min(z + 10, 200))} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: '14px', padding: 0, width: '16px' }}
          >
            +
          </button>
          <span style={{ width: '36px', textAlign: 'right' }}>{zoomLevel}%</span>
        </div>
      </div>
    </div>
  );
});

VexiusTiptapEditor.displayName = 'VexiusTiptapEditor';
