import { Schema, NodeSpec, MarkSpec, DOMOutputSpec } from "prosemirror-model";

const pDOM: DOMOutputSpec = ["p", 0];
const blockquoteDOM: DOMOutputSpec = ["blockquote", 0];
const hrDOM: DOMOutputSpec = ["hr"];
const preDOM: DOMOutputSpec = ["pre", ["code", 0]];
const brDOM: DOMOutputSpec = ["br"];

export const nodes: Record<string, NodeSpec> = {
  doc: {
    content: "block+"
  },

  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{ tag: "p" }],
    toDOM() { return pDOM; }
  },

  blockquote: {
    content: "block+",
    group: "block",
    parseDOM: [{ tag: "blockquote" }],
    toDOM() { return blockquoteDOM; }
  },

  horizontal_rule: {
    group: "block",
    parseDOM: [{ tag: "hr" }],
    toDOM() { return hrDOM; }
  },

  heading: {
    attrs: { level: { default: 1 } },
    content: "inline*",
    group: "block",
    defining: true,
    parseDOM: [
      { tag: "h1", attrs: { level: 1 } },
      { tag: "h2", attrs: { level: 2 } },
      { tag: "h3", attrs: { level: 3 } },
      { tag: "h4", attrs: { level: 4 } },
      { tag: "h5", attrs: { level: 5 } },
      { tag: "h6", attrs: { level: 6 } }
    ],
    toDOM(node) { return ["h" + node.attrs.level, 0]; }
  },

  code_block: {
    content: "text*",
    group: "block",
    code: true,
    defining: true,
    parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
    toDOM() { return preDOM; }
  },

  text: {
    group: "inline"
  },

  image: {
    inline: true,
    attrs: {
      src: {},
      alt: { default: null },
      title: { default: null }
    },
    group: "inline",
    draggable: true,
    parseDOM: [{
      tag: "img[src]",
      getAttrs(dom: HTMLElement) {
        return {
          src: dom.getAttribute("src"),
          title: dom.getAttribute("title"),
          alt: dom.getAttribute("alt")
        };
      }
    }],
    toDOM(node) { return ["img", node.attrs]; }
  },

  hard_break: {
    inline: true,
    group: "inline",
    selectable: false,
    parseDOM: [{ tag: "br" }],
    toDOM() { return brDOM; }
  }
};

const emDOM: DOMOutputSpec = ["em", 0];
const strongDOM: DOMOutputSpec = ["strong", 0];
const codeDOM: DOMOutputSpec = ["code", 0];

export const marks: Record<string, MarkSpec> = {
  link: {
    attrs: {
      href: {},
      title: { default: null }
    },
    inclusive: false,
    parseDOM: [{
      tag: "a[href]",
      getAttrs(dom: HTMLElement) {
        return { href: dom.getAttribute("href"), title: dom.getAttribute("title") };
      }
    }],
    toDOM(node) { return ["a", node.attrs, 0]; }
  },

  em: {
    parseDOM: [
      { tag: "i" }, { tag: "em" },
      { style: "font-style=italic" },
      { style: "font-style=normal", clearMark: m => (m.type.name === "em" as any) }
    ],
    toDOM() { return emDOM; }
  },

  strong: {
    parseDOM: [
      { tag: "strong" }, { tag: "b" },
      { style: "font-weight=400", clearMark: m => (m.type.name === "strong" as any) },
      { style: "font-weight", getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null }
    ],
    toDOM() { return strongDOM; }
  },

  code: {
    parseDOM: [{ tag: "code" }],
    toDOM() { return codeDOM; }
  }
};

export const vexiusSchema = new Schema({ nodes, marks });
