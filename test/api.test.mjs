import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { server, demoAccess } from '../server.mjs';
let base;
// Hosted build environments contain production flags and may contain a real key.
// Tests must never inherit provider credentials or the deployed kill switch.
const environmentKeys = ['ASSEMBLYAI_API_KEY', 'VOICE_DEMO_ENABLED', 'TRUST_PROXY', 'RENDER', 'VOICE_MAX_CONCURRENT', 'VOICE_DAILY_TOKEN_LIMIT'];
const savedEnvironment = environmentKeys.map(key => process.env[key]);
before(() => environmentKeys.forEach(key => { delete process.env[key]; }));
after(() => environmentKeys.forEach((key, index) => {
  if (savedEnvironment[index] === undefined) delete process.env[key];
  else process.env[key] = savedEnvironment[index];
}));
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(()=>server.close());
async function session(){const response=await fetch(base+'/api/demo-sessions',{method:'POST'});assert.equal(response.status,201);return (await response.json()).sessionId;}
test('invalid request URL returns 400 and leaves the server alive', async () => {
  const response = await new Promise((resolve, reject) => {
    const socket = net.connect(server.address().port, '127.0.0.1', () => socket.write('GET //[/ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n'));
    let data = '';
    socket.on('data', chunk => { data += chunk; });
    socket.on('end', () => resolve(data));
    socket.on('error', reject);
  });
  assert.match(response, /^HTTP\/1.1 400/);
  assert.equal((await fetch(base + '/healthz')).status, 200);
});
test('health and static UI include request correlation',async()=>{const health=await fetch(base+'/healthz');assert.equal(health.status,200);assert.match(health.headers.get('x-request-id'),/^[0-9a-f-]{36}$/);assert.match(await(await fetch(base+'/')).text(),/VoiceOps Sentinel/);});
test('investigation requires an owned demo session',async()=>{const response=await fetch(base+'/api/investigations',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(response.status,401);});
test('text investigation accepts only allowed service and scenario',async()=>{const id=await session();const headers={'content-type':'application/json','x-voiceops-session':id};const ok=await fetch(base+'/api/investigations',{method:'POST',headers,body:JSON.stringify({service:'nginx',scenario:'refused'})});assert.equal(ok.status,200);assert.equal((await ok.json()).probable_cause,'upstream_connection_refused');const bad=await fetch(base+'/api/investigations',{method:'POST',headers,body:JSON.stringify({service:'postgres',scenario:'refused'})});assert.equal(bad.status,400);});
test('duplicate tool call returns the same canonical report',async()=>{const id=await session();const options={method:'POST',headers:{'content-type':'application/json','x-voiceops-session':id},body:JSON.stringify({service:'nginx',scenario:'refused',callId:'call-1'})};const first=await(await fetch(base+'/api/investigations',options)).json();const second=await(await fetch(base+'/api/investigations',options)).json();assert.deepEqual(second,first);});

test('canonical reports are retrievable only by their owning session',async()=>{const owner=await session();const other=await session();const created=await fetch(base+'/api/investigations',{method:'POST',headers:{'content-type':'application/json','x-voiceops-session':owner},body:JSON.stringify({service:'nginx',scenario:'timeout'})});const report=await created.json();const owned=await fetch(base+`/api/reports/${report.runId}`,{headers:{'x-voiceops-session':owner}});assert.equal(owned.status,200);assert.deepEqual(await owned.json(),report);const foreign=await fetch(base+`/api/reports/${report.runId}`,{headers:{'x-voiceops-session':other}});assert.equal(foreign.status,404);});
test('voice endpoint fails safely without a key and releases its reservation',async()=>{const id=await session();const response=await fetch(base+'/api/voice-token',{method:'POST',headers:{'x-voiceops-session':id}});assert.equal(response.status,503);assert.doesNotMatch(JSON.stringify(await response.json()),/ASSEMBLYAI_API_KEY/);assert.equal(demoAccess.voiceLeases.has(id),false);});

test('voice lease can be explicitly released',async()=>{const id=await session();demoAccess.acquireVoice(id,'127.0.0.1');const response=await fetch(base+'/api/voice-lease',{method:'DELETE',headers:{'x-voiceops-session':id}});assert.equal(response.status,200);assert.deepEqual(await response.json(),{released:true});});

test('live evaluations are sanitized and isolated by demo session',async()=>{const owner=await session();const other=await session();const capture=await fetch(base+'/api/evaluations',{method:'POST',headers:{'content-type':'application/json','x-voiceops-session':owner},body:JSON.stringify({scenario:'refused',promptVersion:'4',cleanEnd:true,transcript:[{role:'user',text:'Investigate nginx 502 errors',token:'drop'}],report:{runId:'run',status:'incident',probableCause:'upstream_connection_refused',validation:{schema:true,provenance:true,policy:true},evidence:'drop'},secret:'drop'})});assert.equal(capture.status,201);const stored=await capture.json();assert.equal(stored.secret,undefined);assert.equal(stored.report.evidence,undefined);const owned=await(await fetch(base+'/api/evaluations',{headers:{'x-voiceops-session':owner}})).json();assert.equal(owned.evaluations.length,1);const foreign=await(await fetch(base+'/api/evaluations',{headers:{'x-voiceops-session':other}})).json();assert.equal(foreign.evaluations.length,0);});

test('parallel token HTTP requests preserve the first lease and enforce pending budget', async t => {
  const originalFetch = globalThis.fetch;
  const keys = ['ASSEMBLYAI_API_KEY', 'VOICE_DAILY_TOKEN_LIMIT', 'VOICE_MAX_CONCURRENT'];
  const previous = keys.map(key => process.env[key]);
  t.after(() => keys.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; }));
  process.env.ASSEMBLYAI_API_KEY = 'test-only';
  process.env.VOICE_DAILY_TOKEN_LIMIT = '1';
  process.env.VOICE_MAX_CONCURRENT = '2';
  demoAccess.clients.clear(); demoAccess.dailyTokens = [];
  const a = demoAccess.createSession('127.0.0.1'), b = demoAccess.createSession('127.0.0.1');
  let finishProvider, providerStarted;
  const started = new Promise(resolve => { providerStarted = resolve; });
  t.mock.method(globalThis, 'fetch', (url, options) => {
    if (String(url).startsWith('https://agents.assemblyai.com/')) {
      providerStarted();
      return new Promise(resolve => { finishProvider = () => resolve({ ok: true, json: async () => ({ token: 'temporary' }) }); });
    }
    return originalFetch(url, options);
  });
  const issue = id => originalFetch(base + '/api/voice-token', { method: 'POST', headers: { 'x-voiceops-session': id } });
  const first = issue(a.id);
  await started;
  try {
    assert.equal((await issue(a.id)).status, 409);
    assert.equal(demoAccess.voiceLeases.has(a.id), true);
    assert.equal((await issue(b.id)).status, 429);
  } finally { finishProvider(); }
  assert.equal((await first).status, 200);
  assert.equal(demoAccess.dailyTokens.length, 1);
  demoAccess.releaseVoice(a.id, '127.0.0.1');
});
