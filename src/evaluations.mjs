import { randomUUID } from 'node:crypto';

const allowedScenarios = new Set(['refused', 'timeout', 'healthy', 'empty', 'injection']);

export function sanitizeEvaluation(input) {
  if (!input || typeof input !== 'object' || !allowedScenarios.has(input.scenario)) throw evaluationError('Invalid evaluation scenario');
  const transcript = Array.isArray(input.transcript) ? input.transcript.slice(0, 20).map(item => ({
    role: item?.role === 'agent' ? 'agent' : 'user',
    text: String(item?.text || '').slice(0, 1000)
  })) : [];
  const validation = input.report?.validation || {};
  return {
    evaluationId: randomUUID(),
    schemaVersion: '1.0',
    capturedAt: new Date().toISOString(),
    scenario: input.scenario,
    promptVersion: String(input.promptVersion || 'unknown').slice(0, 20),
    startedAt: validDate(input.startedAt),
    endedAt: validDate(input.endedAt),
    durationMs: boundedNumber(input.durationMs, 0, 300_000),
    cleanEnd: input.cleanEnd === true,
    events: sanitizeCounts(input.events),
    transcript,
    tool: input.tool ? {
      called: input.tool.called === true,
      success: input.tool.success === true,
      latencyMs: boundedNumber(input.tool.latencyMs, 0, 30_000)
    } : null,
    report: input.report ? {
      runId: String(input.report.runId || '').slice(0, 64),
      status: String(input.report.status || '').slice(0, 40),
      probableCause: input.report.probableCause === null ? null : String(input.report.probableCause || '').slice(0, 80),
      validation: { schema: validation.schema === true, provenance: validation.provenance === true, policy: validation.policy === true }
    } : null
  };
}

function sanitizeCounts(value) {
  const output = {};
  if (!value || typeof value !== 'object') return output;
  for (const [key, count] of Object.entries(value).slice(0, 20)) {
    if (/^[a-z.]{1,40}$/i.test(key)) output[key] = Math.floor(boundedNumber(count, 0, 10_000));
  }
  return output;
}

function boundedNumber(value, minimum, maximum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : 0;
}

function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function evaluationError(message) { return Object.assign(new Error(message), { status: 400 }); }
