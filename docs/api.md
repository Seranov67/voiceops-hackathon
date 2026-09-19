# VoiceOps API (current scaffold)

All endpoints are same-origin. JSON responses use `Cache-Control: no-store`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Local process health |
| GET | `/api/scenarios` | Allowed synthetic scenarios |
| GET | `/api/incident?scenario=...` | Legacy fixture endpoint |
| POST | `/api/demo-sessions` | Create a short-lived, client-bound demo session |
| POST | `/api/investigations` | Canonical fixture investigation |
| GET | `/api/reports/:runId` | Retrieve an owned canonical report |
| POST | `/api/voice-token` | Single-use AssemblyAI browser token |
| DELETE | `/api/voice-lease` | Release the current voice concurrency slot |
| POST | `/api/evaluations` | Store a sanitized live evaluation capture |
| GET | `/api/evaluations` | Export captures owned by the demo session |

`POST /api/investigations` accepts at most 16 KiB:

```json
{"service":"nginx","scenario":"refused","callId":"optional-provider-call-id"}
```

Only `nginx` and the server-known scenarios are accepted. The question text is currently UI context only; the deterministic fixture baseline is selected explicitly. This limitation must remain visible in the demo.

Protected requests require the `X-VoiceOps-Session` header returned by `POST /api/demo-sessions`. Sessions are bound to the network client, expire after inactivity, and keep a bounded call-result cache for idempotency.

Each response includes `X-Request-Id`. Structured request logs contain only the correlation ID, method, path, status, and duration; they exclude request bodies, tokens, audio, evidence, and client addresses. Set `REQUEST_LOG_ENABLED=false` to disable them.

Live evaluation capture stores bounded provider-event counts, transcript text, tool latency, canonical validation flags, and clean-end status. It explicitly excludes tokens, audio, full evidence records, arbitrary client fields, and other sessions' captures. The in-memory capture is lost on server restart; use **Export JSON** before restarting.

`POST /api/voice-token` returns 503 without server configuration and never returns the long-lived key. Token issuance is limited per client, by concurrent lease count, and by a daily global token budget. A failed provider request rolls back its concurrency reservation without spending daily budget. The browser releases its lease on session cleanup and page exit. `VOICE_DEMO_ENABLED=false` is the operational kill switch.
