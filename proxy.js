import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN;

console.log('Starting proxy server...');
console.log('API_TOKEN exists:', !!API_TOKEN);

if (!API_TOKEN) {
  console.error('ERROR: API_TOKEN environment variable not set!');
}

const BRIGHTDATA_URL = `https://mcp.brightdata.com/mcp?token=${API_TOKEN}`;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    hasToken: !!API_TOKEN
  });
});

app.all('/mcp', async (req, res) => {
  console.log(`Received ${req.method} request to /mcp`);
  
  try {
    console.log('Forwarding to BrightData...');
    
    const response = await fetch(BRIGHTDATA_URL, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    console.log('BrightData responded with status:', response.status);

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      response.body.pipe(res);
    } else {
      const data = await response.text();
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy running on port ${PORT}`);
});
