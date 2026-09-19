# Read-only reuse audit: D:\LLM-Log-Monitor

Date: 2026-09-19. No production requests, service starts, configuration changes or `.env` reads were performed.

## Scope checked

- `AGENTS.md` and repository layout.
- `analyzer/main.py:139-187` — `_loki_query_range`, `fetch_loki_logs`.
- `analyzer/log_answer.py:186-245` — `_loki_get`, label lookup, `fetch_lines`.

## Decision

Do not copy the existing Loki functions into the VoiceOps MVP. Reuse the learned constraints and Loki HTTP response parsing pattern, then implement a small Node.js adapter behind the new `LogProvider` contract after the fixture voice path is stable.

Reasons:

- The donor is Python/httpx while VoiceOps is Node.js with no external dependencies.
- `main.py` returns plain lines without timestamp/id, so it cannot satisfy VoiceOps evidence provenance.
- `main.py` uses a dynamic host selector and a configurable LogQL filter. VoiceOps needs a closed service-to-selector mapping and no model/browser supplied LogQL.
- `log_answer.py` has useful label-whitelist thinking, but `fetch_lines` catches source errors and returns `[]`. VoiceOps must distinguish `source_unavailable` from a successful empty result.
- Existing limits/timeouts are designed for the monitoring bot (`limit=1000`, 30–60 s); they are too broad for the public demo budget.
- The donor repository describes production infrastructure and real labels. Hosted VoiceOps must not contain those identities or depend on VPN access.

## Reusable design knowledge

- Loki range endpoint: `/loki/api/v1/query_range`; nanosecond `start`/`end`; `direction=backward` for latest evidence.
- Loki result shape: each stream has `stream` labels and `values` pairs `[timestamp, line]`.
- A label allowlist should come from trusted server configuration or a controlled discovery step, never raw speech.
- Empty-query conclusions require a positive control; zero rows alone cannot prove a healthy service or a working query.

## Proposed VoiceOps Loki contract

`LokiLogProvider.search({service, windowSeconds, limit})` maps `service=nginx` to a server-owned selector. It clamps the window to 60–900 seconds and limit to 1–100, uses a five-second timeout, preserves Loki timestamp and creates a stable evidence id from timestamp + stream labels + line. It returns `sourceStatus=unavailable` on transport/HTTP/schema failure and `sourceStatus=ok, records=[]` only after a valid empty response.

Authentication and the actual Loki URL remain server configuration. The first adapter tests will use a fake fetch response; no production network is required. Real Loki integration is P1 and requires explicit environment-specific configuration.
