#!/usr/bin/env node

/**
 * Vexius Intelligence MCP Server
 * Exposes Vexius workspace capabilities to any MCP-compatible AI client
 * (Claude Desktop, Cursor, Zed, etc.)
 *
 * Tools:
 *  - vexius_search_workspace
 *  - vexius_read_document
 *  - vexius_update_document
 *  - vexius_read_sheet
 *  - vexius_update_sheet
 *  - vexius_create_slide
 *  - vexius_run_agent
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// ─── Configuration ────────────────────────────────────────────────────────────

const VEXIUS_API_BASE = process.env.VEXIUS_API_URL || 'https://api-prod-vexius.up.railway.app';
const VEXIUS_API_KEY = process.env.VEXIUS_API_KEY || '';

if (!VEXIUS_API_KEY) {
  process.stderr.write('[vexius-mcp] WARNING: VEXIUS_API_KEY is not set.\n');
}

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

async function vexiusRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const url = `${VEXIUS_API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VEXIUS_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Vexius API error ${res.status}: ${errorText}`);
  }

  return res.json();
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'vexius_search_workspace',
    description:
      'Search documents, sheets, and slides within a Vexius workspace by keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'The workspace ID to search within.',
        },
        query: {
          type: 'string',
          description: 'Search keyword or phrase.',
        },
      },
      required: ['workspaceId', 'query'],
    },
  },
  {
    name: 'vexius_read_document',
    description:
      'Read the full text content of a Vexius document by its document ID.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The unique ID of the document to read.',
        },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'vexius_update_document',
    description:
      'Update the content of a Vexius document. Appends or replaces text in the specified document.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The unique ID of the document to update.',
        },
        content: {
          type: 'string',
          description: 'New content (markdown or plain text) to set in the document.',
        },
        mode: {
          type: 'string',
          enum: ['replace', 'append'],
          description: 'Whether to replace all content or append to existing content.',
          default: 'replace',
        },
      },
      required: ['documentId', 'content'],
    },
  },
  {
    name: 'vexius_read_sheet',
    description:
      'Read the data from a Vexius spreadsheet. Returns the sheet as a 2D JSON array.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The unique ID of the spreadsheet document.',
        },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'vexius_update_sheet',
    description:
      'Update one or more cells in a Vexius spreadsheet. Accepts a list of cell updates.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The unique ID of the spreadsheet document.',
        },
        updates: {
          type: 'array',
          description: 'Array of cell updates to apply.',
          items: {
            type: 'object',
            properties: {
              cell: {
                type: 'string',
                description: 'Cell address in A1 notation (e.g. "B6").',
              },
              value: {
                description: 'New value or formula to set in the cell.',
              },
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
    description:
      'Add a new slide to a Vexius presentation document.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The unique ID of the presentation document.',
        },
        title: {
          type: 'string',
          description: 'Title text for the new slide.',
        },
        content: {
          type: 'string',
          description: 'Body content or bullet points for the slide (markdown).',
        },
        layout: {
          type: 'string',
          enum: ['title', 'content', 'two-column', 'blank'],
          description: 'Slide layout type.',
          default: 'content',
        },
      },
      required: ['documentId', 'title', 'content'],
    },
  },
  {
    name: 'vexius_run_agent',
    description:
      'Run a Vexius AI agent on a given query. Available agents: deep-researcher (web research), financial-analyst (spreadsheet analysis), legal-reviewer (contract review).',
    inputSchema: {
      type: 'object',
      properties: {
        agentType: {
          type: 'string',
          enum: ['deep-researcher', 'financial-analyst', 'legal-reviewer'],
          description: 'Type of agent to run.',
        },
        query: {
          type: 'string',
          description: 'The research query, topic, or instruction for the agent.',
        },
        workspaceId: {
          type: 'string',
          description: 'Workspace ID where results will be saved.',
        },
        documentId: {
          type: 'string',
          description: 'Optional document ID to anchor the agent to (required for financial-analyst and legal-reviewer).',
        },
      },
      required: ['agentType', 'query', 'workspaceId'],
    },
  },
];

// ─── Tool Handlers ────────────────────────────────────────────────────────────

async function handleTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case 'vexius_search_workspace': {
      const { workspaceId, query } = args as { workspaceId: string; query: string };
      const data = await vexiusRequest('GET', `/workspaces/${workspaceId}/documents?search=${encodeURIComponent(query)}`);
      return JSON.stringify(data, null, 2);
    }

    case 'vexius_read_document': {
      const { documentId } = args as { documentId: string };
      const data = await vexiusRequest('GET', `/documents/${documentId}`);
      return JSON.stringify(data, null, 2);
    }

    case 'vexius_update_document': {
      const { documentId, content, mode = 'replace' } = args as {
        documentId: string;
        content: string;
        mode?: string;
      };
      const data = await vexiusRequest('PATCH', `/documents/${documentId}`, {
        content,
        mode,
      });
      return JSON.stringify(data, null, 2);
    }

    case 'vexius_read_sheet': {
      const { documentId } = args as { documentId: string };
      const data = await vexiusRequest('GET', `/sheets/${documentId}`);
      return JSON.stringify(data, null, 2);
    }

    case 'vexius_update_sheet': {
      const { documentId, updates } = args as {
        documentId: string;
        updates: Array<{ cell: string; value: unknown }>;
      };
      const data = await vexiusRequest('PATCH', `/sheets/${documentId}`, { updates });
      return JSON.stringify(data, null, 2);
    }

    case 'vexius_create_slide': {
      const { documentId, title, content, layout = 'content' } = args as {
        documentId: string;
        title: string;
        content: string;
        layout?: string;
      };
      const data = await vexiusRequest('POST', `/slides/${documentId}/slides`, {
        title,
        content,
        layout,
      });
      return JSON.stringify(data, null, 2);
    }

    case 'vexius_run_agent': {
      const { agentType, query, workspaceId, documentId } = args as {
        agentType: string;
        query: string;
        workspaceId: string;
        documentId?: string;
      };
      const data = await vexiusRequest('POST', `/ai/agents/${agentType}`, {
        query,
        workspaceId,
        documentId: documentId || 'temp',
      });
      return JSON.stringify(data, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

async function main() {
  const server = new Server(
    {
      name: 'vexius-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleTool(name, (args || {}) as Record<string, unknown>);
      return {
        content: [{ type: 'text', text: result }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[vexius-mcp] Server running on stdio transport.\n');
}

main().catch((err) => {
  process.stderr.write(`[vexius-mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
