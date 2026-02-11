import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const BRIGHTDATA_URL = `https://mcp.brightdata.com/mcp?token=${process.env.API_TOKEN}`;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.all('/mcp', async (req, res) => {
  try {
    const response = await fetch(BRIGHTDATA_URL, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

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
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy running on port ${PORT}`);
});
