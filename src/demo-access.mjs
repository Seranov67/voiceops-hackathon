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
    this.sessions.set(id, { client, expiresAt, calls: new Map(), reports: new Map(), evaluations: new Map() });
    return { id, expiresAt };
  }

  requireSession(id, client) {
    this.prune();
    const session = this.sessions.get(id);
    if (!session || session.client !== client) throw accessError(401, 'A valid demo session is required.');
    session.expiresAt = this.now() + this.sessionTtlMs;
    return session;
  }

  reserveVoice(sessionId, client, { maxConcurrent = 2, dailyLimit = 50, durationMs = 240_000 } = {}) {
    const session = this.requireSession(sessionId, client);
    if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1 || !Number.isInteger(dailyLimit) || dailyLimit < 1) throw accessError(503, 'Voice limits are not configured correctly.');
    this.rateLimit(`voice:${client}`, 3);
    if (this.voiceLeases.has(sessionId)) throw accessError(409, 'This demo session already has an active voice reservation.');
    if (this.voiceLeases.size >= maxConcurrent) throw accessError(429, 'The demo voice capacity is currently full. Use text mode or try again shortly.');
    const pending = [...this.voiceLeases.values()].filter(lease => !lease.committed).length;
    if (this.dailyTokens.length + pending >= dailyLimit) throw accessError(429, 'The demo voice budget has been reached for today. Use text mode.');
    const expiresAt = this.now() + durationMs;
    const id = randomUUID();
    this.voiceLeases.set(sessionId, { id, expiresAt, committed: false });
    session.voiceExpiresAt = expiresAt;
    return { id, expiresAt };
  }

  commitVoice(sessionId, reservationId) {
    const lease = this.voiceLeases.get(sessionId);
    if (!lease || (reservationId && lease.id !== reservationId) || lease.committed) return;
    lease.committed = true;
    this.dailyTokens.push(this.now());
  }

  acquireVoice(sessionId, client, options) {
    const lease = this.reserveVoice(sessionId, client, options);
    this.commitVoice(sessionId, lease.id);
    return lease;
  }

  releaseVoice(sessionId, client, reservationId) {
    this.requireSession(sessionId, client);
    if (reservationId && this.voiceLeases.get(sessionId)?.id !== reservationId) return false;
    // Only the issuing request may roll back an in-flight token reservation.
    if (!reservationId && this.voiceLeases.get(sessionId)?.committed === false) return false;
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

  rememberEvaluation(session, evaluation) {
    if (session.evaluations.size >= 20) session.evaluations.delete(session.evaluations.keys().next().value);
    session.evaluations.set(evaluation.evaluationId, structuredClone(evaluation));
  }

  getEvaluations(session) { return structuredClone([...session.evaluations.values()]); }
}

export function clientId(req) { return req.socket.remoteAddress || 'unknown'; }
export function sessionId(req) { const value = req.headers['x-voiceops-session']; return typeof value === 'string' ? value : ''; }
export function accessError(status, message) { return Object.assign(new Error(message), { status }); }
