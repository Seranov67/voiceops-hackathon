# Live voice evaluations 008–010

- Date: 2026-09-19
- Provider: AssemblyAI Voice Agent API
- Prompt version: 2
- Selected scenario: `healthy`

## Run 008

- Agent correctly stated that no incident was observed in the checked window.
- Evidence: synthetic health check returned `200 OK`.
- Limitations and read-only follow-up were communicated.
- Result: pass.

## Run 009

- Agent first stated that there was no evidence of an active incident.
- It then said the system showed a healthy status. One successful fixture record cannot establish global system health.
- Synthetic-data and business-impact limitations were communicated.
- Result: partial; wording exceeded the evidence boundary.

## Run 010

- Agent correctly stated that it found no evidence of an active incident or 502 errors.
- Evidence: synthetic health check returned `200 OK`.
- It recommended checking the live environment before generalizing.
- Result: pass.

## Corrective action

Prompt version 3 requires the exact boundary `no incident was observed in the checked fixture window` and prohibits describing the service or system as healthy. One additional passing run is required for three bounded healthy-window passes.
