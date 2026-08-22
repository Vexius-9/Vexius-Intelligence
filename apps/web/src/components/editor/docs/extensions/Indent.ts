import { Extension } from '@tiptap/core';

export type IndentOptions = {
  types: string[];
  minLevel: number;
  maxLevel: number;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Set the indent level
       */
      indent: () => ReturnType;
      /**
       * Unset the indent level
       */
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minLevel: 0,
      maxLevel: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const identAttr = element.getAttribute('data-indent');
              return identAttr ? parseInt(identAttr, 10) : 0;
            },
            renderHTML: attributes => {
              if (!attributes.indent) {
                return {};
              }

              return {
                'data-indent': attributes.indent,
                style: `padding-left: ${attributes.indent * 2}rem;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch, editor }: any) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        
        let docChanged = false;
        state.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent < this.options.maxLevel) {
              tr = tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                indent: currentIndent + 1,
              });
              docChanged = true;
            }
          }
        });

        if (docChanged) {
          dispatch && dispatch(tr);
          return true;
        }

        return false;
      },
      outdent: () => ({ tr, state, dispatch, editor }: any) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        
        let docChanged = false;
        state.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent > this.options.minLevel) {
              tr = tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                indent: currentIndent - 1,
              });
              docChanged = true;
            }
          }
        });

        if (docChanged) {
          dispatch && dispatch(tr);
          return true;
        }

        return false;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});
