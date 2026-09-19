# Architecture decisions

## ADR-001 — Voice Agent API browser transport

Status: implemented, live provider verification pending.

The browser asks VoiceOps for `POST /api/voice-token`. VoiceOps calls AssemblyAI `GET https://agents.assemblyai.com/v1/token` with the long-lived API key in the Bearer header. The browser receives only the single-use temporary token. Redemption TTL is 60 seconds and the voice session is capped at 180 seconds.

The browser connects to `wss://agents.assemblyai.com/v1/ws?token=...` and sends an inline `session.update`. The only exposed function tool is `investigate_nginx`; its service argument is restricted to `nginx`. A `tool.call` is translated to VoiceOps `POST /api/investigations`; the server chooses the fixture scenario from UI state and produces the canonical report. The result is sent as `tool.result` only when `reply.done` is the latest relevant event, following the provider protocol.

This browser relay is accepted for the synthetic prototype. It does not make the browser an authority: the backend rejects unknown services and scenarios and constructs the report. Before public hosting, add server session ownership, quota and call deduplication described in the architecture plan.

Audio uses the device-rate `AudioContext`, resamples microphone input to 24 kHz PCM16 in an AudioWorklet, enables browser echo cancellation and disables browser noise suppression. The explicit Stop action sends `session.end`; `pagehide` also sends it synchronously. This avoids leaving the provider's billable resume window open after a normal exit.

Sources checked 2026-09-19:

- https://www.assemblyai.com/docs/voice-agents/voice-agent-api/browser-integration
- https://www.assemblyai.com/docs/voice-agents/voice-agent-api/tools/client-side-tools

Open verification: run one real session, confirm event fields, selected voice id, transcript events, tool ordering and clean `session.ended`. Do not mark P0-1 complete before this.
# Live prompt evaluation

The first real voice run on September 19, 2026 verified token issuance, microphone transcription, and agent audio, but failed to invoke the diagnostic tool after an ambiguously worded request. Prompt version 2 now treats any mention of nginx 502 errors as an immediate investigation request and forbids confirmation loops. See `artifacts/evaluations/live-run-001.md`.

The second live run verified the complete connection-refused vertical slice: user speech, transcript, required tool call, exact server-owned evidence, all three report validations, canonical browser report, and a bounded spoken explanation. This is one successful run, not the full 15-run release evaluation. See `artifacts/evaluations/live-run-002.md`.

Live runs 003 and 004 produced correct connection-refused voice responses, establishing three successful voice responses including run 002. Run 005 produced the first correct upstream-timeout voice response. Their canonical validation flags were not supplied with the transcripts, so they do not yet count as fully captured release-evidence runs. See `artifacts/evaluations/live-runs-003-005.md`.

Live runs 006 and 007 produced correct upstream-timeout voice responses. Together with run 005, the timeout scenario now has three successful voice responses. Canonical validation flags were not supplied with these transcripts and remain an evidence-capture gap. See `artifacts/evaluations/live-runs-006-007.md`.
