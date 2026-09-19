import { FixtureLogProvider, fixtureSets } from './providers/fixtures.mjs';
import { IncidentService } from './incidents/service.mjs';
import { validateEvidence } from './incidents/validate.mjs';
export const scenarios=fixtureSets;
const provider=new FixtureLogProvider(); const service=new IncidentService({provider});
export function searchLogs(scenario){return provider.search({service:'nginx',scenario}).records;}
export function verifyEvidence(evidence,records){return validateEvidence(evidence,records);}
export function investigate(scenario){return service.investigate({service:'nginx',scenario});}
