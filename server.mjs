import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { investigate, scenarios } from './src/incident.mjs';
import { createVoiceToken } from './src/providers/assemblyai.mjs';
import { readJson, sendJson } from './src/http.mjs';
import { DemoAccess, clientId, sessionId } from './src/demo-access.mjs';

export const demoAccess = new DemoAccess();

const publicFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/audio-worklet.js', ['audio-worklet.js', 'text/javascript; charset=utf-8']]
]);

export const server = http.createServer(async (req, res) => {
  const requestId = randomUUID();
  const startedAt = performance.now();
  res.setHeader('X-Request-Id', requestId);
  res.once('finish', () => {
    if (process.env.REQUEST_LOG_ENABLED === 'false') return;
    console.log(JSON.stringify({ event: 'http_request', requestId, method: req.method, path: new URL(req.url, 'http://localhost').pathname, status: res.statusCode, durationMs: Number((performance.now() - startedAt).toFixed(1)) }));
  });
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/healthz') return sendJson(res, 200, { status: 'ok' });
  if (req.method === 'GET' && url.pathname === '/api/scenarios') return sendJson(res, 200, Object.keys(scenarios));
  if (req.method === 'POST' && url.pathname === '/api/demo-sessions') {
    try {
      const session = demoAccess.createSession(clientId(req));
      return sendJson(res, 201, { sessionId: session.id, expiresAt: new Date(session.expiresAt).toISOString() });
    } catch (error) { return sendJson(res, error.status || 500, { error: error.message }); }
  }
  if (url.pathname === '/api/incident') {
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
    try { return sendJson(res, 200, investigate(url.searchParams.get('scenario'))); }
    catch { return sendJson(res, 400, { error: 'Unknown scenario' }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/investigations') {
    try {
      const session = demoAccess.requireSession(sessionId(req), clientId(req));
      demoAccess.rateLimit(`investigation:${clientId(req)}`, 30);
      const body = await readJson(req);
      if (body.service !== 'nginx' || !Object.hasOwn(scenarios, body.scenario)) return sendJson(res, 400, { error: 'Only the allowed nginx fixture scenarios are supported' });
      const cached = demoAccess.cachedCall(session, body.callId);
      if (cached) return sendJson(res, 200, cached);
      const report = investigate(body.scenario);
      demoAccess.rememberCall(session, body.callId, report);
      demoAccess.rememberReport(session, report);
      return sendJson(res, 200, report);
    } catch (error) { return sendJson(res, error.status || 400, { error: error.message }); }
  }
  if (req.method === 'GET' && url.pathname.startsWith('/api/reports/')) {
    try {
      const session = demoAccess.requireSession(sessionId(req), clientId(req));
      const runId = decodeURIComponent(url.pathname.slice('/api/reports/'.length));
      if (!/^[0-9a-f-]{36}$/i.test(runId)) return sendJson(res, 400, { error: 'Invalid run ID' });
      const report = demoAccess.getReport(session, runId);
      return report ? sendJson(res, 200, report) : sendJson(res, 404, { error: 'Report not found in this demo session' });
    } catch (error) { return sendJson(res, error.status || 400, { error: error.message }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/voice-token') {
    const currentSessionId = sessionId(req);
    try {
      if (process.env.VOICE_DEMO_ENABLED === 'false') return sendJson(res, 503, { error: 'Voice mode is temporarily disabled. Use text mode.' });
      demoAccess.reserveVoice(currentSessionId, clientId(req), {
        maxConcurrent: Number(process.env.VOICE_MAX_CONCURRENT || 2),
        dailyLimit: Number(process.env.VOICE_DAILY_TOKEN_LIMIT || 50)
      });
      const token = await createVoiceToken({ apiKey: process.env.ASSEMBLYAI_API_KEY });
      demoAccess.commitVoice(currentSessionId);
      return sendJson(res, 200, { token, expiresInSeconds: 60, maxSessionDurationSeconds: 180 });
    } catch (error) {
      if (currentSessionId) {
        try { demoAccess.releaseVoice(currentSessionId, clientId(req)); } catch {}
      }
      if (error.status) return sendJson(res, error.status, { error: error.message });
      const missing = !process.env.ASSEMBLYAI_API_KEY;
      return sendJson(res, missing ? 503 : 502, { error: missing ? 'Voice is not configured. Use text mode or configure the server key.' : 'Voice provider is unavailable.' });
    }
  }
  if (req.method === 'DELETE' && url.pathname === '/api/voice-lease') {
    try {
      const released = demoAccess.releaseVoice(sessionId(req), clientId(req));
      return sendJson(res, 200, { released });
    } catch (error) { return sendJson(res, error.status || 400, { error: error.message }); }
  }
  const publicFile = publicFiles.get(url.pathname);
  if (req.method !== 'GET' || !publicFile) return sendJson(res, 404, { error: 'Not found' });
  try {
    const file = await readFile(new URL(`./public/${publicFile[0]}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': publicFile[1], 'X-Content-Type-Options': 'nosniff' }); res.end(file);
  } catch { sendJson(res, 500, { error: 'Unable to load interface' }); }
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log('VoiceOps: http://127.0.0.1:3000'));
}
