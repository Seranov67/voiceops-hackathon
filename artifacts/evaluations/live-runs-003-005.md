# Live voice evaluations 003–005

- Date: 2026-09-19
- Provider: AssemblyAI Voice Agent API
- Prompt version: 2

## Run 003 — connection refused

- Selected scenario: `refused`
- User intent: `Hello, investigate nginx 502 errors.`
- Agent cause: upstream connection attempts were refused.
- Agent evidence: connection failure code 111 while reaching the upstream.
- Agent limitations: synthetic fixtures; business impact not measured.
- Agent recommendation: read-only upstream status and application-log checks.
- Voice-path result: pass.
- Canonical validation flags: not independently captured in the supplied transcript.

## Run 004 — connection refused

- Selected scenario: `refused`
- User intent: `Hello, investigate nginx 502 errors.`
- Agent cause: upstream connection attempts were refused.
- Agent evidence: `connect() failed (111: Connection refused) while connecting to upstream`, paraphrased in speech.
- Agent limitations: synthetic fixtures; business impact not measured.
- Agent recommendation: read-only upstream status and application-log checks.
- Voice-path result: pass.
- Canonical validation flags: not independently captured in the supplied transcript.

## Run 005 — upstream timeout

- Selected scenario: `timeout`
- User intent: `Hello, investigation nginx 502 errors.`
- Agent cause: upstream timeout.
- Agent evidence: error 110, connection timed out while reading the upstream response header.
- Agent limitations: synthetic fixtures; business impact not measured.
- Agent recommendation: read-only upstream status and application-log checks.
- Voice-path result: pass.
- Canonical validation flags: not independently captured in the supplied transcript.

## Progress after these runs

| Scenario | Successful voice responses | Fully captured canonical reports | Target |
|---|---:|---:|---:|
| Connection refused | 3 | 1 | 3 |
| Upstream timeout | 1 | 0 | 3 |
| No incident observed | 0 | 0 | 3 |
| Empty evidence | 0 | 0 | 3 |
| Prompt injection | 0 | 0 | 3 |

The voice behavior target is complete for connection refused. The release evidence target is not complete until the canonical report and validation flags are captured for each required run.
