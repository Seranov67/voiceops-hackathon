# VoiceOps Sentinel — architecture and delivery plan

Date: September 19, 2026. Status: implementation plan; it is not evidence that the MVP is ready.

## 1. Product contract

The target user is an on-call SRE or backend engineer. The user asks why nginx is returning 502 responses and receives a concise explanation plus a canonical report with exact log evidence. VoiceOps reads bounded data and recommends checks. It never changes infrastructure.

The demo must show a complete path: spoken question → real AssemblyAI session → constrained tool call → server-owned evidence → validated report → spoken summary. A Playground-only simulation does not satisfy this contract.

The first release is an English browser demo using synthetic data, one service (`nginx`), and one incident family (502 upstream failures). Success is measured through repeatability, evidence correctness, latency, and absence of unauthorized actions. Any time-saving claim requires measurement.

## 2. Verified current state

| Component | Current state | Remaining limitation |
|---|---|---|
| Node.js server | Working | In-memory public-demo controls require a single application instance |
| Browser UI | Voice controls, transcript, text fallback, report card | One complete live connection-refused roundtrip verified |
| Fixtures | Five required cases plus a mixed-signal case | Synthetic only |
| Incident service | Deterministic classification across all records | Narrow nginx taxonomy by design |
| Evidence store | Server-generated run ID and bounded in-memory copies | Single process, no persistence |
| Validators | Schema, provenance, and diagnostic policy | No session ownership yet |
| AssemblyAI adapter | Bounded temporary-token endpoint and verified browser WebSocket roundtrip | Broader live scenario evaluation remains |
| Tests | Automated unit and HTTP coverage plus a 15-run fixture baseline | No live-provider or browser automation test |
| Git | Local repository on `voiceops-hackathon` | No commit or remote yet |
| lablab.ai | Team and saved submission draft | Project assets and final submission missing |

Severity remains `unknown` until the system has business-impact evidence. Confidence is a deterministic rule score, not a calibrated probability. A single 200 record proves only that one checked event was successful; it does not prove full service health.

## 3. Delivery scope

Required MVP:

- AssemblyAI voice session with visible transcript and explicit end control.
- The same server-side read-only incident service for voice and text paths.
- Canonical report containing service, status, cause, exact evidence, limitations, recommendations, and validation results.
- Five required scenarios, three live-agent runs each, plus negative API and security tests.
- Text fallback for denied microphone or provider failure.
- HTTPS hosted demo using synthetic data and bounded provider spending.

Conditional P1: a Loki adapter against a controlled test environment after the fixture demo is stable.

Out of scope: Prometheus, TeamSync, Telegram, PostgreSQL, multi-user SaaS, Kubernetes, automated remediation, telephony, and production credentials.

## 4. Architecture decisions

1. Keep Node.js 22 and ES modules. Add dependencies only when a verified requirement justifies them.
2. Use the AssemblyAI Voice Agent API. The server mints single-use browser tokens; the long-lived key never reaches the browser.
3. Keep authority on the backend: tool registry, scenario mapping, evidence store, report builder, and validators.
4. Use client-side function tools for the synthetic spike. The browser relays a tool call to a constrained backend endpoint but cannot submit arbitrary LogQL, URLs, or trusted evidence.
5. Use fixtures as the public source. Loki implements the same `LogProvider` interface later.
6. Use a deterministic report builder for the first vertical slice. AssemblyAI handles the conversation; the server owns the diagnostic result.
7. Treat the server report as canonical. A spoken paraphrase is not assumed to be identical until transcript evaluation proves it.

Provider details and open verification items are recorded in `docs/decisions.md`.

## 5. Component flow

```text
Browser: microphone, transcript, report, text fallback
        │
        ├── temporary token ──> AssemblyAI Voice Agent
        │                            │ tool.call / tool.result
        ▼                            ▼
VoiceOps HTTP API ──> IncidentService ──> LogProvider
                            │               ├── Fixtures
                            │               └── Loki (optional)
                            ▼
                      EvidenceStore
                            ▼
                 ReportBuilder + Validators
                            ▼
                  Canonical incident report
```

Voice request sequence:

1. The user selects a synthetic scenario and starts a session.
2. The server creates a temporary provider token with a 60-second redemption window and a 180-second session cap.
3. The browser opens the provider WebSocket and declares only `investigate_nginx`.
4. The agent identifies the service and calls the tool before giving a cause.
5. The backend selects the source and stores authoritative records under a server-generated `runId`.
6. The report builder classifies all returned records.
7. Validators check structure, exact provenance, and whether the evidence supports the cause.
8. The UI displays the canonical report and the provider receives it as the tool result.
9. The End action sends `session.end`, then releases audio resources.

The text path calls the same incident service. If voice is unavailable, the user can continue without losing the selected scenario.

## 6. Data contracts

`LogQuery`: `service` from an allowlist, `windowSeconds` clamped to 60–900, and `limit` clamped to 1–100. The server calculates time bounds. Clients never submit raw LogQL.

`LogResult`: `source`, `sourceStatus`, `records[{id, ts, line}]`, `queriedWindow`, `returnedCount`, and `truncated`. A valid empty response and an unavailable source are distinct states.

`IncidentReport` fields:

- `schemaVersion`, `runId`, `source`, `service`, and synthetic `host`;
- `status`: `incident`, `no_incident_observed`, `insufficient_evidence`, or `source_unavailable`;
- `probable_cause`: `upstream_connection_refused`, `upstream_timeout`, `unknown`, or `null`;
- exact `evidence` records;
- `recommended_actions`, heuristic `confidence`, `limitations`, and validation flags.

The provenance validator retrieves authoritative records independently by `runId`. Positive diagnoses require evidence. The policy validator separately checks whether the cited records support the declared cause. Exact quotation alone does not prove causality.

## 7. HTTP API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/healthz` | Process health |
| GET | `/api/scenarios` | Allowed synthetic cases |
| POST | `/api/investigations` | Canonical fixture investigation |
| POST | `/api/voice-token` | Single-use provider token |
| GET | `/api/incident` | Legacy fixture endpoint; remove after migration |

The API includes demo-session creation, client ownership checks, call-ID deduplication, rate limits, voice concurrency leases with explicit disposal, a daily token budget, and a kill switch. Report retrieval by run ID remains future work. The in-memory design supports one application instance; restart invalidates temporary state.

## 8. Security, privacy, and spending

- Store the long-lived AssemblyAI key only in server secrets or local `.env` excluded by Git.
- Add per-client rate limits, a maximum of two concurrent voice sessions, a global daily budget guard, and a kill switch before deployment.
- Limit sessions to 180 seconds, tool calls to five per turn, request bodies to 16 KiB, tool output to 64 KiB, and upstream calls to five seconds unless measured behavior requires adjustment.
- Start audio only after a user gesture. Always expose an End control and send `session.end` on normal exit and page navigation.
- Verify provider recording and retention settings before making privacy claims.
- Use only synthetic public fixtures. Never send production hostnames, user identities, secrets, or raw production logs to the demo.
- Expose no shell, execution, restart, or write tool. Reject unknown arguments and fields.
- Render logs and model output as text, never as HTML.
- Log request IDs, duration, tool status, and validation outcome without tokens, raw audio, or full production records.

Prompt instructions are defense in depth. Capability limits and server validation provide the actual boundary.

## 9. Test strategy

Unit tests cover classification, mixed signals, schema, provenance, policy, allowlists, and token bounds. HTTP tests cover valid requests, invalid services, invalid scenarios, oversized bodies, missing configuration, and sanitized errors.

Live evaluation cases:

1. Connection refused → exact `111` evidence and `upstream_connection_refused`.
2. Upstream timeout → exact `110` evidence and `upstream_timeout`.
3. Healthy checked window → `no_incident_observed`, without claiming global health.
4. Empty records → `insufficient_evidence`, cause `unknown`, confidence below 0.4.
5. Injection line → treated only as data; no action is executed.

Run every case three times after changes to the system prompt, tools, or provider configuration. Preserve prompt/config versions, latency, transcript, canonical report, and pass/fail reason. All 15 runs must pass before `MVP READY`.

Additional negative tests: denied microphone, expired token, provider 429/timeout, foreign or expired run ID, evidence from a previous run, fabricated evidence, high-confidence cause with no evidence, mixed 200/502 records, HTML content in logs, repeated Start clicks, disconnect during a tool call, and clean session termination.

Latency targets are provisional: fixture tool p95 under 500 ms and canonical report p95 under eight seconds after the user finishes speaking. Measure at least 20 runs before reporting latency statistics.

## 10. Reuse and Loki

The read-only audit is in `docs/reuse-audit.md`. Existing Python functions are not copied because they drop evidence identifiers or convert source failures into empty results. VoiceOps reuses only verified Loki API knowledge.

The future Node.js Loki adapter will use `/loki/api/v1/query_range`, server-owned selectors, nanosecond time bounds, backward ordering, stable evidence IDs, strict caps, and a distinct `source_unavailable` result. It will be tested with fake HTTP responses before any controlled environment request.

## 11. Backlog and gates

| ID | Deliverable | Acceptance gate |
|---|---|---|
| R0 | Event rules | Sources dated; unknown event-specific rules clearly marked |
| P0-1 | Provider spike | Live session, one tool roundtrip, transcript, audio, bounded token, clean end |
| P0-2 | Contracts and fixtures | Independent evidence store and five required scenarios |
| P0-3 | Incident service | Correct results for required and mixed-signal cases |
| P0-4 | Voice vertical slice | Microphone → tool → canonical report → spoken response, three consecutive runs |
| P0-5 | Text fallback | Same incident service works after voice failure |
| P0-6 | Public-demo controls | Ownership, rate/concurrency/budget limits, sanitized errors |
| P1-1 | Evaluation | 5 scenarios × 3 with saved results and latency |
| P1-2 | Hosted demo | Public HTTPS URL verified outside the local network |
| P1-3 | Loki adapter | Fixture parity, read-only caps, unavailable distinct from empty |
| P2-1 | Submission assets | Public repository, README, demo URL, video, PDF deck, cover image |
| P2-2 | Release review | Clean setup, secret-history scan, licenses, and external links verified |

Critical path: live provider spike → voice vertical slice → public controls → hosted demo → evaluation → submission assets. Loki must not block the hosted fixture demo.

## 12. Delivery calendar

| Date | Outcome |
|---|---|
| Sep 19 | Architecture, verified constraints, initial scaffold |
| Sep 20 | Live provider spike and reuse audit |
| Sep 21 | Incident contracts, fixtures, and validation |
| Sep 22 | Voice vertical slice and text fallback |
| Sep 23 | Lifecycle, errors, public-demo controls, first live evaluations |
| Sep 24 | HTTPS deployment and external verification |
| Sep 25 | Regression, latency, optional Loki adapter if the critical path is green |
| Sep 26 | Feature freeze, demo recording, and PDF deck |
| Sep 27 | Clean setup, secret/license review, fixes |
| Sep 28 | Final artifacts and submission-form review |
| Sep 29 | Submit after final verification |
| Sep 30 | Emergency buffer only if the official deadline permits it |

Estimated effort for one developer: 35–50 focused engineering hours plus 7–10 hours for submission assets and review, with a 20% contingency. If time is lower, remove Loki and free-form RCA while preserving the real voice tool roundtrip.

## 13. MVP READY gate

- A real AssemblyAI voice roundtrip works; Playground simulation does not count.
- All 15 live-agent scenario runs and negative validation tests pass.
- Every displayed evidence record belongs to the current server-owned run.
- Empty or unavailable data never becomes a confident diagnosis.
- The browser cannot define LogQL or select an evidence source.
- No long-lived keys appear in browser bundles, logs, Git history, or screenshots.
- Text fallback clearly identifies its deterministic mode.
- The HTTPS demo works outside the developer network and the README setup is reproducible.
- Known limits around fixtures, voice paraphrasing, and provider retention are documented honestly.

## 14. Immediate next actions

1. Execute the healthy, empty-evidence, and prompt-injection scenarios three times each.
2. Capture canonical validation results for the uncaptured incident runs.
3. Add explicit clean-session-end evidence and measured live latency to the evaluation artifacts.
