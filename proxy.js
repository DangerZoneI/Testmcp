import express from 'express';
import fetch from 'node-fetch';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN;

console.log('Starting proxy server...');

const BRIGHTDATA_URL = `https://mcp.brightdata.com/mcp?token=${API_TOKEN}`;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Forward all requests to BrightData
app.all('/mcp', async (req, res) => {
  console.log(`${req.method} /mcp`);
  
  try {
    // Build headers - forward important ones from client
    const headers = {
      'Accept': req.headers['accept'] || 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      'User-Agent': req.headers['user-agent'] || 'railway-proxy'
    };

    console.log('Headers:', headers);
    console.log('Query params:', req.query);

    const response = await fetch(BRIGHTDATA_URL, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
      agent: httpsAgent
    });

    console.log('Status:', response.status);

    // Copy response headers
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    // Handle SSE or regular response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      console.log('Streaming SSE response');
      response.body.pipe(res);
    } else {
      const data = await response.text();
      console.log('Response:', data.substring(0, 200));
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy on port ${PORT}`);
});
