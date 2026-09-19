export const READ_ONLY_ACTION = 'Inspect upstream service status and application logs using read-only tools';
const statuses = new Set(['incident', 'no_incident_observed', 'insufficient_evidence', 'source_unavailable']);
const causes = new Set(['upstream_connection_refused', 'upstream_timeout', 'unknown', null]);
const validRecord = item => item && typeof item.id === 'string' && typeof item.ts === 'string' &&
  Number.isFinite(Date.parse(item.ts)) && typeof item.line === 'string';

export function validateEvidence(evidence, records) {
  return Array.isArray(evidence) && Array.isArray(records) && evidence.every(item => validRecord(item) &&
    records.some(record => record && item.id === record.id && item.ts === record.ts && item.line === record.line));
}

export function validateReport(report, records) {
  const schema = !!(report && report.schemaVersion === '1.0' &&
    typeof report.runId === 'string' && /^[0-9a-f-]{36}$/i.test(report.runId) &&
    ['source', 'service', 'host', 'summary'].every(key => typeof report[key] === 'string' && report[key].length > 0) &&
    statuses.has(report.status) && causes.has(report.probable_cause) && report.severity === 'unknown' &&
    Array.isArray(report.evidence) && report.evidence.every(validRecord) &&
    Number.isFinite(report.confidence) && report.confidence >= 0 && report.confidence <= 1 &&
    Array.isArray(report.recommended_actions) && report.recommended_actions.every(item => typeof item === 'string') &&
    Array.isArray(report.limitations) && report.limitations.length > 0 && report.limitations.every(item => typeof item === 'string'));
  if (!schema) return { schema: false, provenance: false, policy: false };
  const provenance = validateEvidence(report.evidence, records);
  let policy = report.recommended_actions.every(action => action === READ_ONLY_ACTION);
  if (report.status === 'incident') {
    const fragment = { upstream_connection_refused: 'connect() failed (111:', upstream_timeout: 'upstream timed out (110:' }[report.probable_cause];
    policy &&= !!fragment && report.evidence.some(item => item.line.includes(fragment));
  } else if (report.status === 'no_incident_observed') {
    policy &&= report.probable_cause === null && report.evidence.length > 0 &&
      Array.isArray(records) && records.length > 0 && records.every(item => validRecord(item) && item.line.includes(' 200 OK'));
  } else {
    policy &&= report.probable_cause === 'unknown' && report.confidence < 0.4;
  }
  return { schema, provenance, policy };
}
