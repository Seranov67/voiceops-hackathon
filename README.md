# VoiceOps Sentinel

VoiceOps Sentinel is a read-only voice SRE assistant built for the AssemblyAI Voice Agent Hackathon. It investigates a focused nginx 502 scenario and produces a canonical incident report with exact, traceable log evidence.

Current status: local UI and HTTP API, synthetic scenarios, deterministic diagnosis, text fallback, independent evidence validation, and browser integration for the AssemblyAI Voice Agent API. A live provider roundtrip has not been verified yet. This is not a finished submission.

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

## Next milestones

1. Run a live provider spike and verify the event contract, tool roundtrip, transcript, audio response, and clean `session.end`.
2. Verify the demo-session, rate, concurrency, daily-budget, and kill-switch controls in the hosted environment.
3. Run the five real-agent scenarios three times each and preserve the evaluation results.
4. Deploy an HTTPS fixture demo, then prepare the public repository, video, pitch deck, and cover image.

See [the architecture plan](docs/architecture-plan.md), [API contract](docs/api.md), [decisions](docs/decisions.md), [hackathon review](docs/hackathon.md), and [reuse audit](docs/reuse-audit.md).
