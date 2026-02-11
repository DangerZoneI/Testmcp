import { spawn } from 'child_process';
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Spawn BrightData MCP as child process
const brightDataProcess = spawn('npx', ['-y', '@brightdata/mcp'], {
  env: {
    ...process.env,
    API_TOKEN: process.env.API_TOKEN,
    PRO_MODE: process.env.PRO_MODE || 'false',
    WEB_UNLOCKER_ZONE: process.env.WEB_UNLOCKER_ZONE || 'mcp_unlocker',
    BROWSER_ZONE: process.env.BROWSER_ZONE || 'mcp_browser'
  }
});

// Create client to connect to BrightData stdio
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@brightdata/mcp'],
  env: {
    API_TOKEN: process.env.API_TOKEN,
    PRO_MODE: process.env.PRO_MODE || 'false'
  }
});

const client = new Client({
  name: 'brightdata-proxy-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

// Create HTTP/SSE server
const server = new Server({
  name: 'brightdata-http-proxy',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Proxy tools from client to server
client.setRequestHandler({
  method: 'tools/list'
}, async () => {
  const tools = await client.request({ method: 'tools/list' }, {});
  return tools;
});

server.setRequestHandler({
  method: 'tools/call'
}, async (request) => {
  return await client.request({
    method: 'tools/call',
    params: request.params
  }, {});
});

// Start client connection
await client.connect(transport);

// Setup SSE endpoint
const sseTransport = new SSEServerTransport('/mcp', server);
app.use(sseTransport.requestHandler());

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP MCP Proxy running on port ${PORT}`);
  console.log(`Connect via: http://0.0.0.0:${PORT}/mcp`);
});
