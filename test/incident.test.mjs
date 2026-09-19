import { test } from 'node:test';
import assert from 'node:assert/strict';
import { investigate, searchLogs, verifyEvidence } from '../src/incident.mjs';
import { validateReport } from '../src/incidents/validate.mjs';

for (const [scenario, cause] of Object.entries({ refused: 'upstream_connection_refused', timeout: 'upstream_timeout', healthy: null, empty: 'unknown', injection: 'unknown' })) {
  test(scenario, () => {
    for (let run = 0; run < 3; run++) {
      const report = investigate(scenario);
      assert.equal(report.probable_cause, cause);
      assert.ok(verifyEvidence(report.evidence, searchLogs(scenario)));
      assert.deepEqual(report.validation, { schema: true, provenance: true, policy: true });
      if (cause === 'unknown') assert.ok(report.confidence < 0.4);
      if (cause === null) assert.ok(report.confidence > 0.9);
    }
  });
}
test('mixed healthy and error evidence uses the error signal',()=>{const report=investigate('mixed');assert.equal(report.probable_cause,'upstream_connection_refused');assert.equal(report.status,'incident');assert.equal(report.evidence.length,2);});
test('reject fabricated evidence and unknown scenarios', () => {
  const records = searchLogs('refused');
  assert.equal(verifyEvidence([{ ...records[0], line: 'fabricated' }], records), false);
  assert.throws(() => investigate('__proto__'));
});

test('report validation rejects malformed schemas, unsafe actions and unsupported diagnoses', () => {
  const report = investigate('refused');
  const records = searchLogs('refused');
  for (const changes of [{ confidence: NaN }, { confidence: 2 }, { status: 'made_up' }, { summary: undefined }, { evidence: [null] }]) {
    assert.equal(validateReport({ ...report, ...changes }, records).schema, false);
  }
  for (const changes of [{ recommended_actions: ['Restart production'] }, { probable_cause: 'upstream_timeout' }, { status: 'insufficient_evidence' }, { evidence: [] }]) {
    assert.equal(validateReport({ ...report, ...changes }, records).policy, false);
  }
  assert.equal(validateReport(null, records).schema, false);
});
