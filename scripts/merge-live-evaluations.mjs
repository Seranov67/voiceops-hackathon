import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename } from 'node:path';
import { buildEvaluationMatrix } from '../src/evaluation-matrix.mjs';

const inputs = process.argv.slice(2);
if (inputs.length < 1) throw new Error('Pass one or more exported live-evaluation JSON files');

const all = [];
for (const input of inputs) {
  const parsed = JSON.parse(await readFile(input, 'utf8'));
  for (const evaluation of parsed.evaluations || []) all.push({ ...evaluation, sourceExport: basename(input) });
}

const artifact = buildEvaluationMatrix(all, inputs.map(input => basename(input)));
await mkdir(new URL('../artifacts/evaluations/', import.meta.url), { recursive: true });
await writeFile(new URL('../artifacts/evaluations/live-formal-matrix.json', import.meta.url), `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify(artifact.summary));
if (artifact.summary.selected !== 15) process.exitCode = 1;
