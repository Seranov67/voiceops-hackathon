import { randomUUID } from 'node:crypto';
export class EvidenceStore {
  #runs = new Map();
  constructor({ ttlMs=600_000 }={}) { this.ttlMs=ttlMs; }
  create(records) { this.prune(); const runId=randomUUID(); this.#runs.set(runId,{expiresAt:Date.now()+this.ttlMs,records:structuredClone(records)}); return runId; }
  get(runId) { const run=this.#runs.get(runId); if(!run||run.expiresAt<=Date.now()){this.#runs.delete(runId);return null;} return structuredClone(run.records); }
  prune() { const now=Date.now(); for(const [id,run] of this.#runs) if(run.expiresAt<=now)this.#runs.delete(id); }
}
