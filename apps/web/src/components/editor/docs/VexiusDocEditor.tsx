import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { ProseMirrorEditor, ProseMirrorEditorRef } from './ProseMirrorEditor';
import { vexiusSchema } from '@/lib/docs/schema';
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { Bold, Italic, Type, Quote, Code, Undo2, Redo2, Heading1, Heading2, Heading3 } from 'lucide-react';

export interface VexiusDocEditorProps {
  documentId: string;
  initialContent?: any;
  aiStatus?: 'idle' | 'running' | 'success';
  onRevertAi?: () => void;
  onAcceptAi?: () => void;
}

export interface VexiusDocEditorRef {
  getCurrentSelection: () => string;
  applyAction: (text: string) => void;
  snapshotStateForAI: () => void;
  revertAIAction: () => void;
}

export const VexiusDocEditor = forwardRef<VexiusDocEditorRef, VexiusDocEditorProps>(({ documentId, initialContent, aiStatus, onRevertAi, onAcceptAi }, ref) => {
  const editorRef = useRef<ProseMirrorEditorRef>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const aiSnapshotRef = useRef<any>(null);

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
    },
    snapshotStateForAI: () => {
      const view = editorRef.current?.view;
      if (!view) return;
      aiSnapshotRef.current = view.state;
    },
    revertAIAction: () => {
      const view = editorRef.current?.view;
      if (!view || !aiSnapshotRef.current) return;
      view.updateState(aiSnapshotRef.current);
      aiSnapshotRef.current = null;
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
      {/* AI Activity Panel */}
      {aiStatus && aiStatus !== 'idle' && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.9rem',
          color: 'var(--text-primary)'
        }}>
          {aiStatus === 'running' && (
            <>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ 
                  display: "inline-block",
                  width: "8px", height: "8px", borderRadius: "50%", background: "#a855f7",
                  animation: "pulse 1.5s infinite"
                }} />
                AI is writing...
              </div>
            </>
          )}
          {aiStatus === 'success' && (
            <>
              <span style={{ color: "#22c55e" }}>AI finished writing.</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={onRevertAi} style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}>Revert</button>
                <button onClick={onAcceptAi} style={{
                  background: '#a855f7',
                  border: 'none',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}>Accept</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Standard Toolbar */}
      <div style={{
        display: 'flex',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: '#fff',
        gap: '8px',
        alignItems: 'center'
      }}>
        <button 
          onClick={() => execCommand(undo)}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button 
          onClick={() => execCommand(redo)}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Redo"
        >
          <Redo2 size={18} />
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }} />

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
        <button 
          onClick={() => execCommand(toggleMark(vexiusSchema.marks.code))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Code"
        >
          <Code size={18} />
        </button>
        
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }} />

        <button 
          onClick={() => execCommand(setBlockType(vexiusSchema.nodes.heading, { level: 1 }))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button 
          onClick={() => execCommand(setBlockType(vexiusSchema.nodes.heading, { level: 2 }))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>
        <button 
          onClick={() => execCommand(setBlockType(vexiusSchema.nodes.heading, { level: 3 }))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </button>
        <button 
          onClick={() => execCommand(setBlockType(vexiusSchema.nodes.paragraph))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Paragraph"
        >
          <Type size={18} />
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }} />

        <button 
          onClick={() => execCommand(wrapIn(vexiusSchema.nodes.blockquote))}
          style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', borderRadius: '4px' }}
          title="Blockquote"
        >
          <Quote size={18} />
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
              if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
              autosaveTimerRef.current = setTimeout(async () => {
                try {
                  const token = localStorage.getItem("vexius_token");
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                  await fetch(`${apiUrl}/documents/${documentId}/content`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ content: JSON.stringify(state.doc.toJSON()) })
                  });
                  console.log("Autosaved successfully");
                } catch (e) {
                  console.error("Autosave failed", e);
                }
              }, 2000);
            }}
          />
        </div>
      </div>
    </div>
  );
});
