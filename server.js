import { spawn } from 'child_process';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple proxy endpoint
app.all('/mcp', express.json(), async (req, res) => {
  try {
    const brightdata = spawn('npx', ['-y', '@brightdata/mcp'], {
      env: {
        ...process.env,
        API_TOKEN: process.env.API_TOKEN,
        PRO_MODE: process.env.PRO_MODE || 'false'
      }
    });

    let output = '';
    let errorOutput = '';

    brightdata.stdout.on('data', (data) => {
      output += data.toString();
    });

    brightdata.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    brightdata.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, output });
      } else {
        res.status(500).json({ error: errorOutput || output });
      }
    });

    if (req.body) {
      brightdata.stdin.write(JSON.stringify(req.body));
      brightdata.stdin.end();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

## File 3: `.gitignore`
```
node_modules/
.env
.DS_Store
*.log
