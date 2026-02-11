import { spawn } from 'child_process';
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Create client that connects to BrightData via stdio
const client = new Client({
  name: 'brightdata-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@brightdata/mcp'],
  env: {
    API_TOKEN: process.env.API_TOKEN,
    PRO_MODE: process.env.PRO_MODE || 'false'
  }
});

// Connect client
await client.connect(transport);
console.log('Connected to BrightData MCP');

// Create HTTP/SSE server that exposes the client
const server = new Server({
  name: 'brightdata-http-server',
  version: '1.0.0'
}, {
  capabilities: client.getServerCapabilities()
});

// Forward all tool calls to BrightData client
server.setRequestHandler({ method: 'tools/list' }, async () => {
  return await client.listTools();
});

server.setRequestHandler({ method: 'tools/call' }, async (request) => {
  return await client.callTool(request.params.name, request.params.arguments);
});

// Setup SSE transport
const sseTransport = new SSEServerTransport('/mcp', server);
app.use(sseTransport.requestHandler());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP server running on port ${PORT}`);
});
