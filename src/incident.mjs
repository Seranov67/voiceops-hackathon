import { FixtureLogProvider, fixtureSets } from './providers/fixtures.mjs';
import { IncidentService } from './incidents/service.mjs';
import { validateReport } from './incidents/validate.mjs';
export const scenarios=fixtureSets;
const provider=new FixtureLogProvider(); const service=new IncidentService({provider});
export function searchLogs(scenario){return provider.search({service:'nginx',scenario}).records;}
export function verifyEvidence(evidence,records){return validateReport({schemaVersion:'1.0',runId:'compatibility',status:'insufficient_evidence',probable_cause:'unknown',confidence:0.2,evidence},records).provenance;}
export function investigate(scenario){return service.investigate({service:'nginx',scenario});}
