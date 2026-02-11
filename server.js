import { spawn } from 'child_process';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/mcp', express.json(), async (req, res) => {
  const mcpProcess = spawn('npx', ['@brightdata/mcp'], {
    env: {
      ...process.env,
      API_TOKEN: process.env.API_TOKEN,
      PRO_MODE: process.env.PRO_MODE || 'false'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  mcpProcess.stdin.write(JSON.stringify(req.body) + '\n');
  
  let response = '';
  mcpProcess.stdout.on('data', (data) => {
    response += data.toString();
  });

  mcpProcess.on('close', () => {
    res.json(JSON.parse(response));
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});