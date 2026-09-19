import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DemoAccess } from '../src/demo-access.mjs';

test('session ownership and expiry are enforced',()=>{let now=1_000;const access=new DemoAccess({now:()=>now,sessionTtlMs:100});const session=access.createSession('client-a');assert.ok(access.requireSession(session.id,'client-a'));assert.throws(()=>access.requireSession(session.id,'client-b'),error=>error.status===401);now=1_201;assert.throws(()=>access.requireSession(session.id,'client-a'),error=>error.status===401);});

test('voice concurrency and daily budget are bounded',()=>{let now=1_000;const access=new DemoAccess({now:()=>now});const a=access.createSession('a'),b=access.createSession('b'),c=access.createSession('c');access.acquireVoice(a.id,'a',{maxConcurrent:2,dailyLimit:2});access.acquireVoice(b.id,'b',{maxConcurrent:2,dailyLimit:2});assert.throws(()=>access.acquireVoice(c.id,'c',{maxConcurrent:2,dailyLimit:2}),error=>error.status===429);now+=180_001;assert.throws(()=>access.acquireVoice(c.id,'c',{maxConcurrent:2,dailyLimit:2}),error=>error.status===429&&/budget/.test(error.message));});

test('call results are deduplicated per session',()=>{const access=new DemoAccess();const created=access.createSession('client');const session=access.requireSession(created.id,'client');const report={runId:'fixed'};access.rememberCall(session,'call-1',report);assert.equal(access.cachedCall(session,'call-1'),report);assert.equal(access.cachedCall(session,'other'),undefined);});

test('uncommitted voice reservations do not spend budget and can be released',()=>{const access=new DemoAccess();const created=access.createSession('client');access.reserveVoice(created.id,'client',{dailyLimit:1});assert.equal(access.dailyTokens.length,0);assert.equal(access.releaseVoice(created.id,'client'),true);assert.equal(access.voiceLeases.size,0);});

test('reports are copied and isolated by session',()=>{const access=new DemoAccess();const first=access.createSession('first'),second=access.createSession('second');const owner=access.requireSession(first.id,'first'),other=access.requireSession(second.id,'second');const report={runId:'run-1',status:'incident'};access.rememberReport(owner,report);report.status='changed';assert.equal(access.getReport(owner,'run-1').status,'incident');assert.equal(access.getReport(other,'run-1'),null);});
