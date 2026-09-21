# VoiceOps Sentinel

VoiceOps Sentinel is a read-only voice SRE assistant built for the AssemblyAI Voice Agent Hackathon. It investigates a focused nginx 502 scenario and produces a canonical incident report with exact, traceable log evidence.

Current status: the HTTPS demo is live at https://voiceops-sentinel.onrender.com with AssemblyAI voice enabled. The project includes five synthetic scenarios, deterministic diagnosis, text fallback, independent evidence validation, browser evaluation capture, hosted control checks, and a committed matrix of three passing voice runs for each scenario.

## Submission assets

- Live application: https://voiceops-sentinel.onrender.com
- Pitch deck: [`artifacts/submission/VoiceOps-Sentinel-Pitch-Deck.pdf`](artifacts/submission/VoiceOps-Sentinel-Pitch-Deck.pdf)
- Editable deck: [`artifacts/submission/VoiceOps-Sentinel-Pitch-Deck.pptx`](artifacts/submission/VoiceOps-Sentinel-Pitch-Deck.pptx)
- Cover image: [`artifacts/submission/VoiceOps-Sentinel-Cover.png`](artifacts/submission/VoiceOps-Sentinel-Cover.png)
- Demo script: [`docs/submission-script.md`](docs/submission-script.md)

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

The merger accepts only cleanly ended runs with a successful tool call, the expected status and cause, and all three canonical validation flags. It deduplicates overlapping exports by `evaluationId` before selecting three runs per scenario; captures without an ID are excluded. The current hosted matrix reports 85.79 ms average server tool latency and 93.7 ms p95 across the selected runs; these figures measure the tool request only, not full conversational latency.

## Submission status

The application, hosted voice checks, evaluation evidence, pitch deck, PDF, cover image, repository materials, and recording script are complete. The remaining submission task is to record and upload the final demonstration video, then attach its URL in the lablab.ai submission form.

Hosted checks verified two concurrent voice reservations, rejection of the third, voice request rate limiting, and the investigation limit. Daily-budget enforcement has local test coverage; the counter is process memory and resets when the Render instance restarts.

See [the architecture plan](docs/architecture-plan.md), [API contract](docs/api.md), [decisions](docs/decisions.md), [hackathon review](docs/hackathon.md), and [reuse audit](docs/reuse-audit.md).

## License

Released under the [MIT License](LICENSE).
