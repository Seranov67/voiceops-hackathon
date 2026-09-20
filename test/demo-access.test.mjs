import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DemoAccess, clientId } from '../src/demo-access.mjs';

test('proxy identity ignores spoofed prefixes and is opt-in', () => {
  const request = { socket: { remoteAddress: '127.0.0.1' }, headers: { 'x-forwarded-for': '198.51.100.9, 203.0.113.8' } };
  assert.equal(clientId(request, false, false), '127.0.0.1');
  assert.equal(clientId(request, true, false), '203.0.113.8');
  request.headers['x-forwarded-for'] = '198.51.100.10, 203.0.113.8';
  assert.equal(clientId(request, true, false), '203.0.113.8');
  request.headers['x-forwarded-for'] = '2001:db8::1';
  assert.equal(clientId(request, true, false), '2001:db8::1');
  request.headers['x-forwarded-for'] = '198.51.100.9, invalid';
  assert.equal(clientId(request, true, false), '127.0.0.1');
  delete request.headers['x-forwarded-for'];
  assert.equal(clientId(request, true, false), '127.0.0.1');
});

test('Render ingress identity is stable across proxy hops and fails closed', () => {
  const request = { socket: { remoteAddress: '10.0.0.1' }, headers: { 'cf-connecting-ip': '203.0.113.8', 'x-forwarded-for': '198.51.100.9, 10.0.0.2' } };
  assert.equal(clientId(request, true, true), '203.0.113.8');
  request.headers['x-forwarded-for'] = '198.51.100.10, 10.0.0.3';
  assert.equal(clientId(request, true, true), '203.0.113.8');
  delete request.headers['cf-connecting-ip'];
  assert.throws(() => clientId(request, true, true), error => error.status === 503);
});

test('session ownership and expiry are enforced',()=>{let now=1_000;const access=new DemoAccess({now:()=>now,sessionTtlMs:100});const session=access.createSession('client-a');assert.ok(access.requireSession(session.id,'client-a'));assert.throws(()=>access.requireSession(session.id,'client-b'),error=>error.status===401);now=1_201;assert.throws(()=>access.requireSession(session.id,'client-a'),error=>error.status===401);});

test('voice concurrency and daily budget are bounded',()=>{let now=1_000;const access=new DemoAccess({now:()=>now});const a=access.createSession('a'),b=access.createSession('b'),c=access.createSession('c');access.acquireVoice(a.id,'a',{maxConcurrent:2,dailyLimit:2});access.acquireVoice(b.id,'b',{maxConcurrent:2,dailyLimit:2});assert.throws(()=>access.acquireVoice(c.id,'c',{maxConcurrent:2,dailyLimit:2}),error=>error.status===429);now+=240_001;assert.throws(()=>access.acquireVoice(c.id,'c',{maxConcurrent:2,dailyLimit:2}),error=>error.status===429&&/budget/.test(error.message));});

test('call results are deduplicated per session',()=>{const access=new DemoAccess();const created=access.createSession('client');const session=access.requireSession(created.id,'client');const report={runId:'fixed'};access.rememberCall(session,'call-1',report);assert.equal(access.cachedCall(session,'call-1'),report);assert.equal(access.cachedCall(session,'other'),undefined);});

test('uncommitted voice reservations can only be rolled back by their issuing request',()=>{const access=new DemoAccess();const created=access.createSession('client');const lease=access.reserveVoice(created.id,'client',{dailyLimit:1});assert.equal(access.dailyTokens.length,0);assert.equal(access.releaseVoice(created.id,'client'),false);assert.equal(access.releaseVoice(created.id,'client',lease.id),true);assert.equal(access.voiceLeases.size,0);});

test('pending tokens count against the daily budget', () => {
  const access = new DemoAccess();
  const a = access.createSession('a'), b = access.createSession('b');
  const lease = access.reserveVoice(a.id, 'a', { dailyLimit: 1 });
  assert.throws(() => access.reserveVoice(b.id, 'b', { dailyLimit: 1 }), /budget/);
  access.commitVoice(a.id, lease.id);
  assert.throws(() => access.reserveVoice(b.id, 'b', { dailyLimit: 1 }), /budget/);
});

test('duplicate reservation and stale rollback cannot replace or remove an active lease', () => {
  const access = new DemoAccess();
  const a = access.createSession('a');
  const lease = access.reserveVoice(a.id, 'a', { maxConcurrent: 1 });
  assert.throws(() => access.reserveVoice(a.id, 'a', { maxConcurrent: 1 }), error => error.status === 409);
  assert.equal(access.releaseVoice(a.id, 'a', 'stale'), false);
  assert.equal(access.voiceLeases.get(a.id).id, lease.id);
  access.commitVoice(a.id, lease.id);
  access.commitVoice(a.id, lease.id);
  assert.equal(access.dailyTokens.length, 1);
});

test('reports are copied and isolated by session',()=>{const access=new DemoAccess();const first=access.createSession('first'),second=access.createSession('second');const owner=access.requireSession(first.id,'first'),other=access.requireSession(second.id,'second');const report={runId:'run-1',status:'incident'};access.rememberReport(owner,report);report.status='changed';assert.equal(access.getReport(owner,'run-1').status,'incident');assert.equal(access.getReport(other,'run-1'),null);});

test('evaluations are copied and isolated by session',()=>{const access=new DemoAccess();const first=access.createSession('first'),second=access.createSession('second');const owner=access.requireSession(first.id,'first'),other=access.requireSession(second.id,'second');const evaluation={evaluationId:'eval-1',cleanEnd:true};access.rememberEvaluation(owner,evaluation);evaluation.cleanEnd=false;assert.equal(access.getEvaluations(owner)[0].cleanEnd,true);assert.deepEqual(access.getEvaluations(other),[]);});
