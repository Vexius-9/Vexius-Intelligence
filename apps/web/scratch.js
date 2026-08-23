const { Editor } = require('@tiptap/core');
const { StarterKit } = require('@tiptap/starter-kit');
const { Table } = require('@tiptap/extension-table');
const { TableRow } = require('@tiptap/extension-table-row');
const { TableCell } = require('@tiptap/extension-table-cell');
const { TableHeader } = require('@tiptap/extension-table-header');
const { PaginationPlus } = require('tiptap-pagination-plus');

try {
  const editor = new Editor({
    extensions: [
      StarterKit,
      Table,
      TableRow,
      TableCell,
      TableHeader,
      PaginationPlus
    ]
  });
  console.log("Success");
} catch(e) {
  console.error("Error:", e);
}
