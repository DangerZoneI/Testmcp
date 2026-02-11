import express from 'express';
import httpProxy from 'http-proxy';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN;

// Create proxy
const proxy = httpProxy.createProxyServer({
  target: `https://mcp.brightdata.com`,
  changeOrigin: true,
  ws: true,
  secure: false,
  followRedirects: true
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
  }
  res.end('Proxy error');
});

// Proxy /mcp to BrightData
app.all('/mcp', (req, res) => {
  console.log(`${req.method} /mcp`);
  
  // Add token to query
  req.url = `/mcp?token=${API_TOKEN}`;
  
  proxy.web(req, res);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy on ${PORT}`);
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/mcp')) {
    req.url = `/mcp?token=${API_TOKEN}`;
    proxy.ws(req, socket, head);
  }
});
