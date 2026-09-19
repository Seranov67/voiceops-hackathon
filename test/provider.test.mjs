import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceToken } from '../src/providers/assemblyai.mjs';
test('voice token stays server-side and uses bounded lifetime',async()=>{let request;const token=await createVoiceToken({apiKey:'secret',fetchImpl:async(url,options)=>{request={url:String(url),options};return{ok:true,json:async()=>({token:'temporary'})};}});assert.equal(token,'temporary');assert.match(request.url,/expires_in_seconds=60/);assert.match(request.url,/max_session_duration_seconds=180/);assert.equal(request.options.headers.Authorization,'Bearer secret');});
test('voice token requires server key',async()=>{await assert.rejects(()=>createVoiceToken({apiKey:''}),/not configured/);});
