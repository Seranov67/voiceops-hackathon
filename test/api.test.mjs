import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../server.mjs';
let base;
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(()=>server.close());
test('health and static UI',async()=>{assert.equal((await fetch(base+'/healthz')).status,200);assert.match(await(await fetch(base+'/')).text(),/VoiceOps Sentinel/);});
test('text investigation accepts only allowed service and scenario',async()=>{const ok=await fetch(base+'/api/investigations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({service:'nginx',scenario:'refused'})});assert.equal(ok.status,200);assert.equal((await ok.json()).probable_cause,'upstream_connection_refused');const bad=await fetch(base+'/api/investigations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({service:'postgres',scenario:'refused'})});assert.equal(bad.status,400);});
test('voice endpoint fails safely without a key',async()=>{const response=await fetch(base+'/api/voice-token',{method:'POST'});assert.equal(response.status,503);assert.doesNotMatch(JSON.stringify(await response.json()),/ASSEMBLYAI_API_KEY/);});
