import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { ProseMirrorEditor, ProseMirrorEditorRef } from './ProseMirrorEditor';
import { vexiusSchema } from '@/lib/docs/schema';
import { toggleMark, setBlockType } from 'prosemirror-commands';
import { Bold, Italic, Type, List, ListOrdered } from 'lucide-react';

export interface VexiusDocEditorProps {
  documentId: string;
  initialContent?: any;
}

export interface VexiusDocEditorRef {
  getCurrentSelection: () => string;
  applyAction: (text: string) => void;
}

export const VexiusDocEditor = forwardRef<VexiusDocEditorRef, VexiusDocEditorProps>(({ documentId, initialContent }, ref) => {
  const editorRef = useRef<ProseMirrorEditorRef>(null);

  useImperativeHandle(ref, () => ({
    getCurrentSelection: () => {
      const state = editorRef.current?.state;
      if (!state) return "";
      const { from, to } = state.selection;
      if (from === to) return "";
      return state.doc.textBetween(from, to, "\n");
    },
    applyAction: (text: string) => {
      const view = editorRef.current?.view;
      if (!view) return;
      const { state, dispatch } = view;
      const tr = state.tr.replaceSelectionWith(state.schema.text(text));
      tr.setMeta("vexius", { source: "ai" });
      dispatch(tr);
    }
  }));

  const execCommand = (commandFn: any) => {
    const view = editorRef.current?.view;
    if (view) {
      commandFn(view.state, view.dispatch);
      view.focus();
    }
  };

  const isMarkActive = (markType: any) => {
    const state = editorRef.current?.state;
    if (!state) return false;
    const { from, $from, to, empty } = state.selection;
    if (empty) {
      return !!markType.isInSet(state.storedMarks || $from.marks());
    } else {
      return state.doc.rangeHasMark(from, to, markType);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Editor Toolbar */}
      <div style={{
        display: 'flex',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: '#fff',
        gap: '8px',
        alignItems: 'center'
      }}>
        <button 
          onClick={() => execCommand(toggleMark(vexiusSchema.marks.strong))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button 
          onClick={() => execCommand(toggleMark(vexiusSchema.marks.em))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }} />

        <button 
          onClick={() => execCommand(setBlockType(vexiusSchema.nodes.heading, { level: 1 }))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Heading 1"
        >
          <Type size={18} />
        </button>
        <button 
          onClick={() => execCommand(setBlockType(vexiusSchema.nodes.paragraph))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Paragraph"
        >
          <Type size={14} />
        </button>
      </div>

      {/* Editor Canvas Container (Grey background simulating a desk) */}
      <div style={{
        flex: 1,
        background: '#f3f4f6',
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'center',
        padding: '40px 0'
      }}>
        {/* A4 Paper size approximation */}
        <div style={{
          width: '816px', // 8.5 inches * 96 DPI
          minHeight: '1056px', // 11 inches * 96 DPI
          background: '#fff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: '2px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <ProseMirrorEditor 
            ref={editorRef}
            schema={vexiusSchema}
            initialContent={initialContent}
            onChange={(state) => {
              // Autosave trigger can go here later
            }}
          />
        </div>
      </div>
    </div>
  );
});
