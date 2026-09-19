import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEvaluationMatrix } from '../src/evaluation-matrix.mjs';
const cases = { refused: ['incident', 'upstream_connection_refused'], timeout: ['incident', 'upstream_timeout'], healthy: ['no_incident_observed', null], empty: ['insufficient_evidence', 'unknown'], injection: ['insufficient_evidence', 'unknown'] };
const runs = Object.entries(cases).map(([scenario, [status, probableCause]]) => ({
  evaluationId: scenario, scenario, cleanEnd: true,
  tool: { called: true, success: true, latencyMs: 10 },
  report: { status, probableCause, validation: { schema: true, provenance: true, policy: true } }
}));
test('overlapping exports do not multiply successful runs', () => {
  const matrix = buildEvaluationMatrix([...runs, ...runs, ...runs]);
  assert.equal(matrix.summary.passed, 5);
  assert.equal(matrix.summary.failed, 10);
});
test('three independent runs per scenario complete the matrix', () => {
  const matrix = buildEvaluationMatrix([0, 1, 2].flatMap(n => runs.map(run => ({ ...run, evaluationId: `${run.evaluationId}-${n}` }))));
  assert.equal(matrix.summary.passed, 15);
  assert.equal(matrix.summary.failed, 0);
});
