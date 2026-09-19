import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename } from 'node:path';

const inputs = process.argv.slice(2);
if (inputs.length < 1) throw new Error('Pass one or more exported live-evaluation JSON files');

const expected = {
  refused: ['incident', 'upstream_connection_refused'],
  timeout: ['incident', 'upstream_timeout'],
  healthy: ['no_incident_observed', null],
  empty: ['insufficient_evidence', 'unknown'],
  injection: ['insufficient_evidence', 'unknown']
};

const all = [];
for (const input of inputs) {
  const parsed = JSON.parse(await readFile(input, 'utf8'));
  for (const evaluation of parsed.evaluations || []) all.push({ ...evaluation, sourceExport: basename(input) });
}

function isValid(item, scenario) {
  const [status, cause] = expected[scenario];
  return item.scenario === scenario && item.cleanEnd === true && item.tool?.called === true && item.tool?.success === true &&
    item.report?.status === status && item.report?.probableCause === cause && item.report?.validation?.schema === true &&
    item.report?.validation?.provenance === true && item.report?.validation?.policy === true;
}

const selected = [];
const scenarioSummary = {};
for (const scenario of Object.keys(expected)) {
  const valid = all.filter(item => isValid(item, scenario));
  scenarioSummary[scenario] = { availableValid: valid.length, selected: Math.min(3, valid.length) };
  selected.push(...valid.slice(0, 3));
}

const latencies = selected.map(item => item.tool.latencyMs).sort((a, b) => a - b);
const artifact = {
  schemaVersion: '1.0',
  kind: 'assemblyai_live_voice_matrix',
  createdAt: new Date().toISOString(),
  sources: inputs.map(input => basename(input)),
  selectionPolicy: 'First three fully valid captures per required scenario',
  summary: {
    required: 15,
    selected: selected.length,
    passed: selected.length,
    failed: 15 - selected.length,
    averageToolLatencyMs: latencies.length ? Number((latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(2)) : null,
    p95ToolLatencyMs: latencies.length ? latencies[Math.ceil(latencies.length * 0.95) - 1] : null,
    scenarios: scenarioSummary
  },
  evaluations: selected
};

await mkdir(new URL('../artifacts/evaluations/', import.meta.url), { recursive: true });
await writeFile(new URL('../artifacts/evaluations/live-formal-matrix.json', import.meta.url), `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify(artifact.summary));
if (selected.length !== 15) process.exitCode = 1;
