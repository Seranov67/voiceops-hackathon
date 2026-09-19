import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server, demoAccess } from '../server.mjs';
let base;
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(()=>server.close());
async function session(){const response=await fetch(base+'/api/demo-sessions',{method:'POST'});assert.equal(response.status,201);return (await response.json()).sessionId;}
test('health and static UI',async()=>{assert.equal((await fetch(base+'/healthz')).status,200);assert.match(await(await fetch(base+'/')).text(),/VoiceOps Sentinel/);});
test('investigation requires an owned demo session',async()=>{const response=await fetch(base+'/api/investigations',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(response.status,401);});
test('text investigation accepts only allowed service and scenario',async()=>{const id=await session();const headers={'content-type':'application/json','x-voiceops-session':id};const ok=await fetch(base+'/api/investigations',{method:'POST',headers,body:JSON.stringify({service:'nginx',scenario:'refused'})});assert.equal(ok.status,200);assert.equal((await ok.json()).probable_cause,'upstream_connection_refused');const bad=await fetch(base+'/api/investigations',{method:'POST',headers,body:JSON.stringify({service:'postgres',scenario:'refused'})});assert.equal(bad.status,400);});
test('duplicate tool call returns the same canonical report',async()=>{const id=await session();const options={method:'POST',headers:{'content-type':'application/json','x-voiceops-session':id},body:JSON.stringify({service:'nginx',scenario:'refused',callId:'call-1'})};const first=await(await fetch(base+'/api/investigations',options)).json();const second=await(await fetch(base+'/api/investigations',options)).json();assert.deepEqual(second,first);});
test('voice endpoint fails safely without a key and releases its reservation',async()=>{const id=await session();const response=await fetch(base+'/api/voice-token',{method:'POST',headers:{'x-voiceops-session':id}});assert.equal(response.status,503);assert.doesNotMatch(JSON.stringify(await response.json()),/ASSEMBLYAI_API_KEY/);assert.equal(demoAccess.voiceLeases.has(id),false);});

test('voice lease can be explicitly released',async()=>{const id=await session();demoAccess.acquireVoice(id,'127.0.0.1');const response=await fetch(base+'/api/voice-lease',{method:'DELETE',headers:{'x-voiceops-session':id}});assert.equal(response.status,200);assert.deepEqual(await response.json(),{released:true});});
