import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { investigate } from '../src/incident.mjs';

const cases = {
  refused: ['incident', 'upstream_connection_refused'],
  timeout: ['incident', 'upstream_timeout'],
  healthy: ['no_incident_observed', null],
  empty: ['insufficient_evidence', 'unknown'],
  injection: ['insufficient_evidence', 'unknown']
};

const runs = [];
for (const [scenario, expected] of Object.entries(cases)) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const started = performance.now();
    const report = investigate(scenario);
    const durationMs = Number((performance.now() - started).toFixed(3));
    const validationPassed = Object.values(report.validation).every(Boolean);
    const passed = report.status === expected[0] && report.probable_cause === expected[1] && validationPassed;
    runs.push({ scenario, attempt, durationMs, passed, expected: { status: expected[0], probableCause: expected[1] }, report });
  }
}

const durations = runs.map(run => run.durationMs).sort((a, b) => a - b);
const artifact = {
  schemaVersion: '1.0',
  kind: 'deterministic_fixture_baseline',
  createdAt: new Date().toISOString(),
  environment: { node: process.version, provider: 'synthetic-fixtures', voiceAgentUsed: false },
  summary: { total: runs.length, passed: runs.filter(run => run.passed).length, failed: runs.filter(run => !run.passed).length, p95DurationMs: durations[Math.ceil(durations.length * 0.95) - 1] },
  runs
};

await mkdir(new URL('../artifacts/evaluations/', import.meta.url), { recursive: true });
await writeFile(new URL('../artifacts/evaluations/fixture-baseline.json', import.meta.url), `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify(artifact.summary));
if (artifact.summary.failed) process.exitCode = 1;
