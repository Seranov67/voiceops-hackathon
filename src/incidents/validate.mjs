const exact=(item,records)=>records.some(record=>item.id===record.id&&item.ts===record.ts&&item.line===record.line);
export function validateReport(report,records){
  const schema=report?.schemaVersion==='1.0'&&typeof report.runId==='string'&&Array.isArray(report.evidence)&&typeof report.confidence==='number';
  const provenance=schema&&report.evidence.every(item=>exact(item,records)); const needsEvidence=report.status==='incident'||report.status==='no_incident_observed'; let policy=!needsEvidence||report.evidence.length>0;
  if(report.probable_cause==='upstream_connection_refused')policy&&=records.some(record=>record.line.includes('connect() failed (111:'));
  else if(report.probable_cause==='upstream_timeout')policy&&=records.some(record=>record.line.includes('upstream timed out (110:'));
  else if(report.probable_cause===null)policy&&=records.length>0&&records.every(record=>record.line.includes(' 200 OK'));
  else if(report.probable_cause!=='unknown')policy=false;
  if(report.status==='insufficient_evidence')policy&&=report.confidence<0.4;
  return {schema,provenance,policy};
}
