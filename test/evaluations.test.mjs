import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeEvaluation } from '../src/evaluations.mjs';

test('evaluation capture is bounded and excludes arbitrary fields',()=>{const result=sanitizeEvaluation({scenario:'refused',promptVersion:'4',startedAt:'2026-09-19T10:00:00Z',endedAt:'2026-09-19T10:00:02Z',durationMs:2000,cleanEnd:true,events:{'tool.call':1,'bad key!':9},transcript:[{role:'agent',text:'safe',secret:'drop'}],tool:{called:true,success:true,latencyMs:12,raw:'drop'},report:{runId:'run',status:'incident',probableCause:'upstream_connection_refused',validation:{schema:true,provenance:true,policy:true},evidence:'drop'},token:'drop'});assert.equal(result.cleanEnd,true);assert.deepEqual(result.events,{'tool.call':1});assert.deepEqual(result.transcript,[{role:'agent',text:'safe'}]);assert.equal(result.token,undefined);assert.equal(result.report.evidence,undefined);});

test('evaluation capture rejects unknown scenarios',()=>{assert.throws(()=>sanitizeEvaluation({scenario:'production'}),error=>error.status===400);});
