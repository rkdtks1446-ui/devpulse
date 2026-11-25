const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { classifyPrSize } = require('./prSizeAnalyzer');
const { validateCommitMessage } = require('./commitValidator');
const { evaluateAllFlags } = require('./featureFlags');
const { assignVariant, trackEvent } = require('./abTest');

const PORT = Number(process.env.PORT) || 8080;
const startTime = Date.now();
let requestCount = 0;

function createServer() {
  return http.createServer((req, res) => {
    requestCount += 1;
    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (reqUrl.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'devpulse',
        uptimeSec: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
      }));
      return;
    }

    if (reqUrl.pathname === '/ready') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready: true }));
      return;
    }

    if (reqUrl.pathname === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        service: 'devpulse',
        requestsTotal: requestCount,
        memoryUsageMb: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2)),
        uptimeSec: Math.floor((Date.now() - startTime) / 1000)
      }));
      return;
    }

    if (reqUrl.pathname === '/api/analyze') {
      const lines = reqUrl.searchParams.get('lines') || '120';
      const commit = reqUrl.searchParams.get('commit') || 'feat(ci): add cloud deploy';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        prSize: classifyPrSize(lines),
        validCommit: validateCommitMessage(commit)
      }));
      return;
    }

    if (reqUrl.pathname === '/api/flags') {
      const userId = reqUrl.searchParams.get('userId') || 'anonymous';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ userId, flags: evaluateAllFlags({ userId }) }));
      return;
    }

    if (reqUrl.pathname === '/api/experiment') {
      const userId = reqUrl.searchParams.get('userId') || 'guest-1';
      const eventType = reqUrl.searchParams.get('event') || 'exposure';
      const assignment = assignVariant(userId);
      const tracked = trackEvent({ userId, eventType });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ assignment, tracked }));
      return;
    }

    if (reqUrl.pathname === '/' || reqUrl.pathname === '/index.html') {
      const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
      if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(htmlPath, 'utf8'));
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`DevPulse server listening on port ${PORT}`);
  });
}

module.exports = { createServer };
