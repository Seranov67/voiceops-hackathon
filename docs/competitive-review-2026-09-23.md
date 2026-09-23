# Competitive review - September 23, 2026

The official AssemblyAI Voice Agent Hackathon page lists September 1-30, 2026 and a $10,000 prize pool: $5,000 cash plus $5,000 AssemblyAI credits. Its page data showed 3,636 initial participants when checked on September 23. This number changes and does not measure the number or quality of finished submissions. The timeline data lists the end of submissions as September 30 at 19:00 GMT+4 (15:00 UTC); confirm this in the signed-in submission form before relying on it.

Sources:

- https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon
- https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon/boomerang/boomerang-the-agent-that-calls-you-back
- https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon/rhemaai-forge/voxarchitect-voice-native-intelligence

Boomerang describes a voice callback for a coding agent and an explicit verbal approval receipt before side effects. VoxArchitect describes temporary AssemblyAI tokens, repository evidence, GitHub integration, and approval-gated actions. These are their public submission claims, not independently verified test results. Their action-approval feature serves a different workflow from VoiceOps' read-only incident investigation. Temporary provider tokens alone are not a unique VoiceOps advantage.

## VoiceOps position

The strongest demonstrated distinction is the complete chain from a spoken question to a server-owned incident report: exact records, an evidence provenance check, a separate policy check, and a safe unknown result when data are missing. The demo now presents that chain directly on screen while keeping the full canonical JSON available.

Do not claim real incident RCA, Loki, or Prometheus integration for the current hosted application. It uses synthetic nginx records and a narrow deterministic classifier. Its `confidence` field is a heuristic rule score, not a calibrated probability. A single healthy record supports only the checked window. The hosted 15/15 matrix validates tool execution, expected report status/cause, three report checks, and clean session end; it does not prove spoken wording is always perfectly calibrated.

## Priority before submission

1. Record a demo that shows connection refusal, unknown cause with no records, and injected log instructions. Keep the evidence panel and the report visible as the agent speaks.
2. Describe the product as *evidence-backed voice incident triage*. Show the exact record and validation flags before discussing architecture.
3. Add a controlled Loki adapter only if a safe test source with synthetic data is available and can be evaluated end to end. Never relabel a fixture as a real incident. Prometheus correlation requires a separate source and validation plan, so it is future work.
4. If a controlled source becomes available, preserve source timestamps, labels, query window, and retrieval status. Validate that source failure is distinct from an empty successful query, and test negative and injection cases before changing the hosted demo.
