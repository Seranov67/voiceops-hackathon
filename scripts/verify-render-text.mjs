import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const base='https://voiceops-sentinel.onrender.com';
const results=[];
async function request(path,method='GET',id,body,extra={}) {
 const r=await fetch(base+path,{method,headers:{'content-type':'application/json',...(id?{'x-voiceops-session':id}:{}),...extra},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});
 return {status:r.status,data:r.headers.get('content-type')?.includes('application/json')?await r.json():null};
}
assert.equal((await request('/healthz')).status,200);
const a=await request('/api/demo-sessions','POST'); assert.equal(a.status,201);
const b=await request('/api/demo-sessions','POST'); assert.equal(b.status,201);
for(const [scenario,status,cause] of [['refused','incident','upstream_connection_refused'],['timeout','incident','upstream_timeout'],['healthy','no_incident_observed',null],['empty','insufficient_evidence','unknown'],['injection','insufficient_evidence','unknown']]) {
 const r=await request('/api/investigations','POST',a.data.sessionId,{service:'nginx',scenario});
 assert.equal(r.status,200); assert.equal(r.data.status,status); assert.equal(r.data.probable_cause,cause); assert.ok(Object.values(r.data.validation).every(v=>v===true));
 assert.equal((await request('/api/reports/'+r.data.runId,'GET',b.data.sessionId)).status,404);
 results.push({scenario,passed:true});
}
for(const extra of [{'x-forwarded-for':'198.51.100.9'},{'cf-connecting-ip':'198.51.100.10'},{'true-client-ip':'198.51.100.11'}]) {
 const r=await request('/api/investigations','POST',a.data.sessionId,{service:'nginx',scenario:'refused'},extra); assert.equal(r.status, Object.hasOwn(extra,'cf-connecting-ip') ? 403 : 200);
}
assert.equal((await request('/api/investigations','POST',undefined,{service:'nginx',scenario:'refused'})).status,401);
assert.equal((await request('/api/voice-token','POST',a.data.sessionId)).status,503);
const report={date:new Date().toISOString(),base,deployedCommit:'8a040a1',scenarios:results,foreignReportsDenied:true,missingSessionDenied:true,spoofedForwardedHeadersDidNotBreakSession:true,voiceKillSwitch:true,voiceProviderTested:false};
writeFileSync('artifacts/evaluations/render-text-smoke-2026-09-20.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
