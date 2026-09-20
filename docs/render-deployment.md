# Render deployment

Latest status: voice is enabled via the linked `voiceops-provider` group and the service's kill-switch setting. Prompt v5 is deployed. Its hosted technical matrix is complete (15/15); occasional definitive spoken cause wording is an accepted demo limitation. On September 20, hosted checks verified two concurrent voice reservations, rejection of the third, the voice request rate limit, and the investigation limit (30 accepted, next request rejected). Test reservations were released. See `artifacts/evaluations/render-controls-2026-09-20.json`. Daily-budget enforcement has local test coverage but has not been tested to exhaustion on Render; its in-memory reset limitation remains.

Deployed 2026-09-20: https://voiceops-sentinel.onrender.com (Render Free, Frankfurt). Runtime commit: `8a040a1`. Hosted text/API smoke passed all five scenarios, session/report isolation, and the disabled voice endpoint. Voice configuration and live hosted tests remain pending. Results: `artifacts/evaluations/render-text-smoke-2026-09-20.json`.

Use the root `render.yaml` Blueprint with branch `voiceops-hackathon`. It creates one free Node.js 22 web service in Frankfurt, runs `npm test` before deployment, starts with `npm start`, and probes `/healthz`. Render supplies `PORT` and HTTPS. No dependency installation or compilation is required by the current application. Automatic deploys are off to avoid invalidating active evaluations on a push.

## First deployment

1. Push the reviewed deployment changes to the configured GitHub branch.
2. Sign in to Render, create a Blueprint from the repository, and select that branch. Confirm the Free service plan before applying it.
3. Wait for the build and health check, then open the generated HTTPS URL. The initial deployment intentionally enables text mode only.
4. Verify all five text scenarios and session ownership from two separate browser sessions. With Render's `RENDER=true` and `TRUST_PROXY=true`, client identity uses the Cloudflare ingress `CF-Connecting-IP` header and fails closed if it is absent. Hosted checks confirmed that changing `X-Forwarded-For` and `True-Client-IP` did not change session ownership; a forged `CF-Connecting-IP` request was rejected by the edge with HTTP 403. The rightmost forwarded address is unsuitable on this deployment because Render has multiple internal hops. Outside Render, proxy mode still uses the rightmost forwarded address and must only be enabled behind a verified trusted ingress.
5. Add `ASSEMBLYAI_API_KEY` through Render's secret environment settings and set `VOICE_DEMO_ENABLED=true` after the checks. Never commit the key or put it in a URL.
6. Run voice tests from outside the developer network: microphone, all five scenarios, End, immediate restart, and Export JSON. Verify rate limits, two-session concurrency, the daily token guard and the kill switch with controlled test settings, then restore the intended limits.
7. Export captures before redeploying and record the public URL and deployed commit. Refresh the 15-run matrix using hosted captures.

## Operational limits

Keep one application instance. Sessions, reports, evaluation captures, concurrency leases and the rolling daily token count live in process memory. All reset on restart, redeploy or free-service sleep. The 50-token guard is therefore not a durable billing cap across restarts; keep voice disabled until this limitation is accepted or persistent quota storage is added. Provider billing remains separate from Render's free compute.

Render Free sleeps after 15 minutes without inbound traffic and can take about a minute to wake. The browser's direct AssemblyAI socket does not keep the Render backend awake. Export evaluations promptly. A paid always-on instance avoids idle sleep, but does not make in-memory state durable.

Sources: https://render.com/docs/web-services, https://render.com/docs/blueprint-spec, https://render.com/docs/free.
