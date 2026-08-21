import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';

// A simple React wrapper around ProseMirror
export interface ProseMirrorEditorProps {
  schema: Schema;
  initialContent?: any;
  onChange?: (state: EditorState) => void;
  readOnly?: boolean;
}

export interface ProseMirrorEditorRef {
  view: EditorView | null;
  state: EditorState | null;
}

export const ProseMirrorEditor = forwardRef<ProseMirrorEditorRef, ProseMirrorEditorProps>(
  ({ schema, initialContent, onChange, readOnly = false }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<EditorView | null>(null);

    useImperativeHandle(ref, () => ({
      view,
      get state() {
        return view?.state || null;
      },
    }));

    useEffect(() => {
      if (!editorRef.current) return;

      // Initialize state
      let state: EditorState;
      try {
        state = EditorState.create({
          schema,
          plugins: [
            history(),
            keymap({
              'Mod-z': undo,
              'Mod-y': redo,
              'Shift-Mod-z': redo,
            }),
            keymap(baseKeymap),
          ],
        });
      } catch (err) {
        console.error("Failed to initialize ProseMirror state", err);
        return;
      }

      // Initialize view
      const editorView = new EditorView(editorRef.current, {
        state,
        editable: () => !readOnly,
        dispatchTransaction(transaction: Transaction) {
          // Normal ProseMirror dispatch logic
          const newState = editorView.state.apply(transaction);
          editorView.updateState(newState);
          
          if (onChange) {
            onChange(newState);
          }
        },
      });

      setView(editorView);

      return () => {
        editorView.destroy();
      };
    }, [schema, readOnly]); // Initial content handling could be added here later

    return (
      <div 
        ref={editorRef} 
        style={{
          width: '100%',
          height: '100%',
          outline: 'none',
          padding: '40px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          lineHeight: 1.6,
        }}
        className="prosemirror-container"
      />
    );
  }
);

ProseMirrorEditor.displayName = 'ProseMirrorEditor';
