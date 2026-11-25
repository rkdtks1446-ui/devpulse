const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createServer } = require('../src/server');
const { generateBuildManifest } = require('../src/index');
const { evaluateFlag } = require('../src/featureFlags');
const { assignVariant, trackEvent, summarizeEvents } = require('../src/abTest');
const { isHealthy } = require('../src/canaryRollout');
const { parseSafeJson } = require('../src/jsonSanitizer');
const { validateCommitMessage } = require('../src/commitValidator');

function requestJson(port, reqPath) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: reqPath }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

describe('HTTP Server, Build Manifest & Edge-Case Coverage', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = createServer();
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('server responds properly on all endpoints and returns 404 for unknown routes', async () => {
    const health = await requestJson(port, '/health');
    expect(health.status).toBe(200);
    expect(JSON.parse(health.body).status).toBe('ok');

    const ready = await requestJson(port, '/ready');
    expect(JSON.parse(ready.body).ready).toBe(true);

    const metrics = await requestJson(port, '/metrics');
    expect(JSON.parse(metrics.body).requestsTotal).toBeGreaterThanOrEqual(3);

    const analyze = await requestJson(port, '/api/analyze?lines=320&commit=fix(api):%20patch');
    expect(JSON.parse(analyze.body)).toEqual({ prSize: 'Medium', validCommit: true });

    const flags = await requestJson(port, '/api/flags?userId=sre-oncall');
    expect(JSON.parse(flags.body).flags.enableDoraAnomalyAlert.enabled).toBe(true);

    const exp = await requestJson(port, '/api/experiment?userId=tester-9&event=exposure');
    expect(['A', 'B']).toContain(JSON.parse(exp.body).assignment.variant);

    const home = await requestJson(port, '/');
    expect(home.status).toBe(200);
    expect(home.body).toContain('DevPulse Dashboard');

    const notFound = await requestJson(port, '/does-not-exist');
    expect(notFound.status).toBe(404);
  });

  test('generateBuildManifest writes manifest JSON with secret detection', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devpulse-dist-'));
    const manifest = generateBuildManifest({ distDir: tmpDir, env: { DEVPULSE_API_TOKEN: 'token' } });
    expect(manifest.secretConfigured).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'build-manifest.json'))).toBe(true);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('covers edge cases for flags, A/B event logging, canary, sanitizer, and commit validator', () => {
    expect(evaluateFlag('nonExistentFlag').reason).toBe('unknown_flag');
    expect(evaluateFlag('enableCompactDashboardUi', { userId: 'regular-user', env: { FF_COMPACT_DASHBOARD_UI: 'invalid' } }).reason).toBe('rollout:50%');
    expect(evaluateFlag('enableStrictCommitGate', { userId: 'u', env: { FF_STRICT_COMMIT_GATE: '0' } }).enabled).toBe(false);
    expect(evaluateFlag('enableStrictCommitGate', { userId: 'u', env: { FF_STRICT_COMMIT_GATE: '1' } }).enabled).toBe(true);

    expect(() => assignVariant('')).toThrow('userId must be a non-empty string');
    const tmpLog = path.join(os.tmpdir(), `ab-${Date.now()}.jsonl`);
    trackEvent({ userId: 'log-user', eventType: 'exposure', logFilePath: tmpLog });
    expect(fs.existsSync(tmpLog)).toBe(true);
    fs.unlinkSync(tmpLog);
    expect(summarizeEvents([{ variant: 'Z', eventType: 'exposure' }]).A.conversionRate).toBe(0);

    expect(isHealthy({ healthStatus: 'degraded', errorRate: 0.01, p95LatencyMs: 100 }, {
      requireHealthOk: false, maxErrorRate: 0.05, maxP95LatencyMs: 300
    })).toBe(true);

    expect(() => parseSafeJson(null)).toThrow('Input JSON text cannot be null or undefined');
    expect(validateCommitMessage(12345)).toBe(false);
  });
});
