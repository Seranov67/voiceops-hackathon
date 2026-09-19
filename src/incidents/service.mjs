import { EvidenceStore } from './evidence-store.mjs';
import { buildReport } from './report.mjs';
import { validateReport } from './validate.mjs';
export class IncidentService {
  constructor({provider,evidenceStore=new EvidenceStore()}){this.provider=provider;this.evidenceStore=evidenceStore;}
  investigate(query){const result=this.provider.search(query);const runId=this.evidenceStore.create(result.records);const report=buildReport({runId,result,service:query.service});report.validation=validateReport(report,this.evidenceStore.get(runId)||[]);if(!Object.values(report.validation).every(Boolean))throw new Error('Incident report validation failed');return report;}
}
