import { READ_ONLY_ACTION } from './validate.mjs';
const has=(records,fragment)=>records.some(record=>record.line.includes(fragment));
export function buildReport({runId,result,service='nginx'}) {
  const records=result.records; let status='insufficient_evidence',probableCause='unknown',summary='Insufficient diagnostic evidence',confidence=0.2;
  if(result.sourceStatus!=='ok'){status='source_unavailable';summary='Log source is unavailable';confidence=0;}
  else if(has(records,'connect() failed (111:')){status='incident';probableCause='upstream_connection_refused';summary='Upstream connection attempts were refused';confidence=0.85;}
  else if(has(records,'upstream timed out (110:')){status='incident';probableCause='upstream_timeout';summary='Upstream requests timed out';confidence=0.85;}
  else if(records.length>0&&records.every(record=>record.line.includes(' 200 OK'))){status='no_incident_observed';probableCause=null;summary='No incident observed in the checked fixture window';confidence=0.95;}
  return {schemaVersion:'1.0',runId,source:result.source,service,host:'synthetic-host',status,severity:'unknown',summary,probable_cause:probableCause,evidence:records.length?records:[],recommended_actions:status==='incident'?[READ_ONLY_ACTION]:[],confidence,limitations:['Synthetic fixture data','Business impact was not measured']};
}
