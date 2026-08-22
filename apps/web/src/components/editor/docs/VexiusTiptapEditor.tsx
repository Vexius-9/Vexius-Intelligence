import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Link } from '@tiptap/extension-link';
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
import { VexiusRibbon } from './VexiusRibbon';
import { Maximize, Minimize } from 'lucide-react';

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

export const VexiusTiptapEditor = forwardRef<VexiusTiptapEditorRef, VexiusTiptapEditorProps>(({ documentId, initialContent, onUpdate, sidebar, navbarElement, documentName }, ref) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopilotVisible, setIsCopilotVisible] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
      }),
      CustomBulletList,
      CustomOrderedList,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontFamily,
      Underline,
      Highlight.configure({ multicolor: true }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      FontSize,
      LineHeight,
      Indent,
      Youtube.configure({
        controls: false,
      }),
      CharacterCount,
    ],
    content: initialContent || '',
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'vexius-tiptap-paper',
      },
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      <div style={{ zIndex: 10, position: 'relative' }}>
        <VexiusRibbon editor={editor} navbarElement={navbarElement} />
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

        <div style={{
          background: '#ffffff',
          width: '816px', // A4 width at 96 DPI
          minHeight: '1056px', // A4 height at 96 DPI
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '96px', // Standard 1-inch margins
          outline: 'none',
          marginBottom: '40px',
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.1s ease-out'
        }}>
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
          <span>Page 1 of 1</span>
          <span>{editor.storage.characterCount.words()} words</span>
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
