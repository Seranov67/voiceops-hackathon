# VoiceOps Sentinel

VoiceOps Sentinel is a read-only voice SRE assistant built for the AssemblyAI Voice Agent Hackathon. It investigates a focused nginx 502 scenario and produces a canonical incident report with exact, traceable log evidence.

Current status: local UI and HTTP API, synthetic scenarios, deterministic diagnosis, text fallback, independent evidence validation, browser live-evaluation capture, and a committed matrix of three passing voice runs for each of the five required AssemblyAI scenarios. The HTTPS text demo is deployed at https://voiceops-sentinel.onrender.com and its five-scenario API smoke passes. Hosted voice configuration and verification remain incomplete.

## Run locally

Requirements: Node.js 22 or later. The scaffold currently has no external npm dependencies.

```sh
npm test
npm run evaluate
npm start
```

Open http://127.0.0.1:3000. Text mode works without an API key.

For a voice test:

1. Copy `.env.example` to `.env`.
2. Add `ASSEMBLYAI_API_KEY` to the local `.env` file.
3. Restart the server and select **Start voice session**.

The long-lived key stays on the server. Never paste it into browser code, screenshots, issues, or commits.

## Architecture

Browser → AssemblyAI voice session → allowlisted read-only tool → IncidentService → EvidenceStore → report and policy validators → canonical incident report.

The public demo uses synthetic fixtures. Loki is an optional later adapter and cannot block the hosted demo. The project exposes no write tools and performs no production actions.

`npm run evaluate` executes the five deterministic fixture scenarios three times each and writes the evidence-preserving baseline to `artifacts/evaluations/fixture-baseline.json`. This baseline does not represent a live AssemblyAI evaluation.

Every completed browser voice session creates a sanitized live-evaluation record with provider-event counts, transcript, tool latency, canonical validation flags, and clean-end status. Use **Export JSON** before restarting the single-process demo; live captures are intentionally session-owned and in-memory.

The committed formal live matrix contains 15 passing AssemblyAI voice runs: three for each required scenario. It is generated from browser exports with:

```sh
npm run evaluate:live -- path/to/export-one.json path/to/export-two.json
```

The merger accepts only cleanly ended runs with a successful tool call, the expected status and cause, and all three canonical validation flags. It deduplicates overlapping exports by `evaluationId` before selecting three runs per scenario; captures without an ID are excluded. The current matrix reports 8.85 ms average server tool latency and 10.6 ms p95 across the selected runs; these figures do not represent full conversational latency.

## Next milestones

Render deployment is prepared in `render.yaml`; follow [the deployment guide](docs/render-deployment.md). The initial Free service runs text mode until hosted checks and server-secret configuration are complete.

1. Local post-fix voice smoke completed: five captured runs, one per required scenario, passed tool, report-validation, and clean-end checks. See [the smoke review](artifacts/evaluations/post-fix-smoke-2026-09-20.md). The export does not measure perceived audio quality or hardware microphone release.
2. Verify the demo-session, rate, concurrency, daily-budget, and kill-switch controls in the hosted environment.
3. Refresh the five-scenario live matrix after hosted verification and preserve the exported captures.
4. Deploy an HTTPS fixture demo, then prepare the public repository, video, pitch deck, and cover image.

See [the architecture plan](docs/architecture-plan.md), [API contract](docs/api.md), [decisions](docs/decisions.md), [hackathon review](docs/hackathon.md), and [reuse audit](docs/reuse-audit.md).
