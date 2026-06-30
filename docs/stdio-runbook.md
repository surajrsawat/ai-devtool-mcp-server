# MCP Stdio Runbook

This runbook defines how to run and validate MCP stdio against the API backend.

## Prerequisites
- API repo dependencies installed.
- MCP server repo dependencies installed.
- Node.js 22+ available.

## Start Commands
1. Start API:
   - In ai-devtool-api: `npm run start:dev`
2. Start MCP stdio server:
   - In ai-devtool-mcp-server: `API_BASE_URL=http://127.0.0.1:3001 npm run start:stdio`

## End-to-End Local Validation
Run from ai-devtool-mcp-server:
- `npm run e2e:local`

What this validates:
- API health endpoint is reachable.
- MCP stdio boots and handshake succeeds.
- MCP tools list includes:
  - repo_index_status
  - repo_search
  - review_start
  - review_status
- Tool calls execute against API and return valid payloads.

## CI/Deployment Recommendation
- Add `npm run e2e:local` (or equivalent split checks) as a preview gate before staging promotion.
