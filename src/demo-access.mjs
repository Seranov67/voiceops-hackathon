import { randomUUID } from 'node:crypto';

const minute = 60_000;
const day = 86_400_000;

export class DemoAccess {
  constructor({ now = Date.now, sessionTtlMs = 30 * minute } = {}) {
    this.now = now;
    this.sessionTtlMs = sessionTtlMs;
    this.sessions = new Map();
    this.clients = new Map();
    this.voiceLeases = new Map();
    this.dailyTokens = [];
  }

  prune() {
    const now = this.now();
    for (const [id, session] of this.sessions) if (session.expiresAt <= now) this.sessions.delete(id);
    for (const [id, lease] of this.voiceLeases) if (lease.expiresAt <= now) this.voiceLeases.delete(id);
    this.dailyTokens = this.dailyTokens.filter(timestamp => timestamp > now - day);
    for (const [client, timestamps] of this.clients) {
      const current = timestamps.filter(timestamp => timestamp > now - minute);
      if (current.length) this.clients.set(client, current); else this.clients.delete(client);
    }
  }

  rateLimit(client, limit = 30) {
    this.prune();
    const timestamps = this.clients.get(client) || [];
    if (timestamps.length >= limit) throw accessError(429, 'Demo request limit reached. Try again shortly.');
    timestamps.push(this.now());
    this.clients.set(client, timestamps);
  }

  createSession(client) {
    this.rateLimit(client, 10);
    const id = randomUUID();
    const expiresAt = this.now() + this.sessionTtlMs;
    this.sessions.set(id, { client, expiresAt, calls: new Map(), reports: new Map() });
    return { id, expiresAt };
  }

  requireSession(id, client) {
    this.prune();
    const session = this.sessions.get(id);
    if (!session || session.client !== client) throw accessError(401, 'A valid demo session is required.');
    session.expiresAt = this.now() + this.sessionTtlMs;
    return session;
  }

  reserveVoice(sessionId, client, { maxConcurrent = 2, dailyLimit = 50, durationMs = 180_000 } = {}) {
    const session = this.requireSession(sessionId, client);
    this.rateLimit(`voice:${client}`, 3);
    if (this.voiceLeases.size >= maxConcurrent && !this.voiceLeases.has(sessionId)) throw accessError(429, 'The demo voice capacity is currently full. Use text mode or try again shortly.');
    if (this.dailyTokens.length >= dailyLimit) throw accessError(429, 'The demo voice budget has been reached for today. Use text mode.');
    const expiresAt = this.now() + durationMs;
    this.voiceLeases.set(sessionId, { expiresAt, committed: false });
    session.voiceExpiresAt = expiresAt;
    return { expiresAt };
  }

  commitVoice(sessionId) {
    const lease = this.voiceLeases.get(sessionId);
    if (!lease || lease.committed) return;
    lease.committed = true;
    this.dailyTokens.push(this.now());
  }

  acquireVoice(sessionId, client, options) {
    const lease = this.reserveVoice(sessionId, client, options);
    this.commitVoice(sessionId);
    return lease;
  }

  releaseVoice(sessionId, client) {
    this.requireSession(sessionId, client);
    return this.voiceLeases.delete(sessionId);
  }

  cachedCall(session, callId) { return callId ? session.calls.get(callId) : undefined; }

  rememberCall(session, callId, result) {
    if (!callId) return;
    if (session.calls.size >= 20) session.calls.delete(session.calls.keys().next().value);
    session.calls.set(callId, result);
  }

  rememberReport(session, report) {
    if (session.reports.size >= 20) session.reports.delete(session.reports.keys().next().value);
    session.reports.set(report.runId, structuredClone(report));
  }

  getReport(session, runId) {
    const report = session.reports.get(runId);
    return report ? structuredClone(report) : null;
  }
}

export function clientId(req) { return req.socket.remoteAddress || 'unknown'; }
export function sessionId(req) { const value = req.headers['x-voiceops-session']; return typeof value === 'string' ? value : ''; }
export function accessError(status, message) { return Object.assign(new Error(message), { status }); }
