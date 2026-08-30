# @vexius/mcp

**Official Vexius Intelligence MCP Server** — connect Claude Desktop, Cursor, Zed, and any MCP-compatible AI client directly to your Vexius workspace.

[![npm version](https://badge.fury.io/js/%40vexius%2Fmcp.svg)](https://badge.fury.io/js/%40vexius%2Fmcp)

## Tools Available

| Tool | Description |
|------|-------------|
| `vexius_search_workspace` | Search documents, sheets, and slides by keyword |
| `vexius_read_document` | Read full text content of any document |
| `vexius_update_document` | Update document content (replace or append) |
| `vexius_read_sheet` | Read spreadsheet data as a 2D array |
| `vexius_update_sheet` | Update cells in a spreadsheet (A1 notation) |
| `vexius_create_slide` | Add new slides to a presentation |
| `vexius_run_agent` | Run AI agents (deep-researcher, financial-analyst, legal-reviewer) |

## Installation

```bash
npm install -g @vexius/mcp
```

## Setup

### 1. Get your API Key

Log in to [vexiusintelligence.tech](https://vexiusintelligence.tech), go to **Settings → API Keys**, and generate a key.

### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vexius": {
      "command": "vexius-mcp",
      "env": {
        "VEXIUS_API_KEY": "vex_live_your_key_here"
      }
    }
  }
}
```

### 3. Configure Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vexius": {
      "command": "npx",
      "args": ["-y", "@vexius/mcp"],
      "env": {
        "VEXIUS_API_KEY": "vex_live_your_key_here"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VEXIUS_API_KEY` | ✅ Yes | — | Your Vexius API key |
| `VEXIUS_API_URL` | ❌ No | `https://api-prod-vexius.up.railway.app` | Custom API endpoint |

## Example Usage

Once connected, you can ask your AI client:

> *"Open my Q3 Financial Model in Vexius, update the revenue assumption to 15%, and return the new EBITDA."*

> *"Research Solana vs Ethereum Layer 2 performance in 2026 using the Vexius Deep Researcher."*

> *"Read my 'Product Roadmap' document in workspace abc-123."*

## Local Development

```bash
git clone https://github.com/Vexius-9/Vexius-Intelligence
cd nexius-engine/packages/mcp
npm install
npm run build
VEXIUS_API_KEY=your_key node dist/server.js
```

## License

MIT — [Vexius Intelligence](https://vexiusintelligence.tech)
