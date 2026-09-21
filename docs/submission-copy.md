# VoiceOps Sentinel - submission copy

## Title

VoiceOps Sentinel

## Tagline

A voice SRE assistant that investigates nginx 502 errors and shows the exact evidence behind every report.

## Short description

VoiceOps Sentinel lets an on-call engineer ask aloud why nginx is returning 502 errors. AssemblyAI handles the live voice session, while a constrained read-only backend investigates a controlled scenario and returns a canonical report with exact log evidence, provenance, and independent validation.

## Full description

During an incident, the first explanation is often produced under time pressure and with incomplete evidence. VoiceOps Sentinel demonstrates a safer voice workflow for that moment. An engineer says, "Investigate nginx 502 errors." The AssemblyAI voice agent invokes one allowlisted diagnostic tool. The Node.js backend selects server-owned evidence, classifies the result, validates the report schema and provenance, and returns a read-only recommendation.

The demo covers five synthetic scenarios: upstream connection refusal, upstream timeout, a checked window with only a healthy record, no records, and a prompt-injection attempt embedded in a log line. Log content is always treated as data. The agent has no shell, restart, deployment, or infrastructure write capability.

The hosted evaluation matrix contains three valid AssemblyAI voice runs for every scenario. All 15 selected runs completed the tool call, produced the expected status and cause, passed schema, provenance, and policy validation, and ended cleanly. The displayed report remains canonical when a spoken paraphrase varies.

## Built with

- AssemblyAI Voice Agent API
- Node.js 22
- Browser Web Audio and WebSocket APIs
- Render

## Links

- Live demo: https://voiceops-sentinel.onrender.com
- Source code: https://github.com/Seranov67/voiceops-hackathon
- Pitch deck: `artifacts/submission/VoiceOps-Sentinel-Pitch-Deck.pdf`
- Cover image: `artifacts/submission/VoiceOps-Sentinel-Cover.png`

## Evidence and limits

- 15 of 15 selected hosted voice runs passed the technical matrix.
- Average tool-request latency: 85.79 ms; sample p95: 93.7 ms.
- These timings exclude full conversational latency.
- The demo uses synthetic nginx fixtures; business impact was not measured.
- Voice quotas and session state are held in process memory and reset when the Render instance restarts.
- Real production log integration remains future work.

## Suggested categories

- Voice Assistant
- Developer Tools
- DevOps
- Cybersecurity

## Final form checklist

- Application URL
- Public GitHub URL
- Cover image
- PDF presentation
- Demonstration video URL
- Technology tags including AssemblyAI
