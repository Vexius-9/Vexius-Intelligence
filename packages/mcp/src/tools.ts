import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const TOOLS: Tool[] = [
  {
    name: 'vexius_search_workspace',
    description: 'Search documents, sheets, and slides within a Vexius workspace by keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'The workspace ID to search within.' },
        query: { type: 'string', description: 'Search keyword or phrase.' },
      },
      required: ['workspaceId', 'query'],
    },
  },
  {
    name: 'vexius_read_document',
    description: 'Read the full text content of a Vexius document by its document ID.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'The unique ID of the document to read.' },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'vexius_update_document',
    description: 'Update the content of a Vexius document.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'The unique ID of the document.' },
        content: { type: 'string', description: 'New content (markdown or plain text).' },
        mode: { type: 'string', enum: ['replace', 'append'], default: 'replace' },
      },
      required: ['documentId', 'content'],
    },
  },
  {
    name: 'vexius_read_sheet',
    description: 'Read data from a Vexius spreadsheet. Returns a 2D JSON array.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'The unique ID of the spreadsheet.' },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'vexius_update_sheet',
    description: 'Update one or more cells in a Vexius spreadsheet.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'The unique ID of the spreadsheet.' },
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cell: { type: 'string', description: 'Cell address in A1 notation (e.g. "B6").' },
              value: { description: 'New value or formula.' },
            },
            required: ['cell', 'value'],
          },
        },
      },
      required: ['documentId', 'updates'],
    },
  },
  {
    name: 'vexius_create_slide',
    description: 'Add a new slide to a Vexius presentation.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'The unique ID of the presentation.' },
        title: { type: 'string', description: 'Title text for the new slide.' },
        content: { type: 'string', description: 'Body content (markdown).' },
        layout: { type: 'string', enum: ['title', 'content', 'two-column', 'blank'], default: 'content' },
      },
      required: ['documentId', 'title', 'content'],
    },
  },
  {
    name: 'vexius_run_agent',
    description: 'Run a Vexius AI agent. Agents: deep-researcher, financial-analyst, legal-reviewer.',
    inputSchema: {
      type: 'object',
      properties: {
        agentType: { type: 'string', enum: ['deep-researcher', 'financial-analyst', 'legal-reviewer'] },
        query: { type: 'string', description: 'Research query or instruction.' },
        workspaceId: { type: 'string', description: 'Workspace ID where results will be saved.' },
        documentId: { type: 'string', description: 'Optional document ID (required for financial-analyst / legal-reviewer).' },
      },
      required: ['agentType', 'query', 'workspaceId'],
    },
  },
];
