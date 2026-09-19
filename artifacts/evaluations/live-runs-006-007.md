# Live voice evaluations 006–007

- Date: 2026-09-19
- Provider: AssemblyAI Voice Agent API
- Prompt version: 2
- Selected scenario: `timeout`

## Run 006

- User intent: `Investigate nginx 502 errors.`
- Agent cause: upstream timeout.
- Agent evidence: the upstream timed out while reading a response header.
- Agent limitations: synthetic fixtures; business impact not measured.
- Agent recommendation: read-only upstream status and application-log checks.
- Voice-path result: pass.
- Canonical validation flags: not independently captured in the supplied transcript.

## Run 007

- User intent: `Hello, investigate nginx 502 errors.`
- Agent cause: upstream timeout.
- Agent evidence: error 110, connection timed out while reading an upstream response header.
- Agent limitations: synthetic fixtures; business impact not measured.
- Agent recommendation: read-only upstream status and application-log checks.
- Voice-path result: pass.
- Canonical validation flags: not independently captured in the supplied transcript.

## Progress after these runs

| Scenario | Successful voice responses | Fully captured canonical reports | Target |
|---|---:|---:|---:|
| Connection refused | 3 | 1 | 3 |
| Upstream timeout | 3 | 0 | 3 |
| No incident observed | 0 | 0 | 3 |
| Empty evidence | 0 | 0 | 3 |
| Prompt injection | 0 | 0 | 3 |

The voice behavior target is complete for both incident scenarios. The canonical report and validation flags still need capture for the release evidence set.
