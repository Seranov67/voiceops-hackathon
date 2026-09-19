# VoiceOps API (current scaffold)

All endpoints are same-origin. JSON responses use `Cache-Control: no-store`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Local process health |
| GET | `/api/scenarios` | Allowed synthetic scenarios |
| GET | `/api/incident?scenario=...` | Legacy fixture endpoint |
| POST | `/api/investigations` | Canonical fixture investigation |
| POST | `/api/voice-token` | Single-use AssemblyAI browser token |

`POST /api/investigations` accepts at most 16 KiB:

```json
{"service":"nginx","scenario":"refused"}
```

Only `nginx` and the server-known scenarios are accepted. The question text is currently UI context only; the deterministic fixture baseline is selected explicitly. This limitation must remain visible in the demo.

`POST /api/voice-token` returns 503 without server configuration and never returns the long-lived key. Before public deployment this endpoint still needs ownership, rate limiting, concurrency limits and a global budget guard.
