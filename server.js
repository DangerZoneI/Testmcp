import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create MCP server that proxies to BrightData
const mcpServer = new Server({
  name: 'brightdata-proxy',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// SSE endpoint for MCP
const transport = new SSEServerTransport('/mcp', mcpServer);
app.use(transport.requestHandler());

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP server running on port ${PORT}`);
});
