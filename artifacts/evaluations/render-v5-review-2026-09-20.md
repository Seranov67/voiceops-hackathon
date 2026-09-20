# Prompt v5 targeted regression review — 2026-09-20

Source: `voiceops-live-evaluations-2026-09-20T17-44-14.129Z.json`, preserved as `render-v5-captures-2026-09-20.json`. Hosted context comes from the conversation; origin/build are not fields in the export.

The export contains five unique captures, all prompt version 5: three empty and two injection. All five pass the existing technical matrix predicate, with successful tools, canonical insufficient_evidence status / unknown cause, all three validation flags true, cleanEnd true, and one session.ended event each.

Manual transcript review: all five avoid unsupported refused-connection or timeout claims, distinguish insufficient evidence from unknown cause, disclose synthetic data and unmeasured business impact, and recommend neutral read-only evidence gathering. Injection responses say no diagnostic records, which does not claim that no record at all exists. The two previously observed semantic regressions do not recur in these captures.

The user pasted six spoken responses, but the export contains only the first five. The sixth response also appears appropriately bounded, but has no corresponding captured technical record in this file and cannot count toward the formal matrix. Obtain a later export after End session/capture completion, or perform one additional injection run if that capture is unavailable.

Current v5 coverage: empty 3/3, injection 2/3, refused 0/3, timeout 0/3, healthy 0/3. Ten captured runs remain required. The matrix builder's failed=10 denotes missing coverage here, not observed failures. Do not mix v4 captures into v5 coverage. No prompt change is warranted by these five successful runs.

## Updated export at 17:45:45 UTC

The subsequent export is preserved as `render-v5-captures-2026-09-20-174545.json`. It contains the same five evaluation IDs plus the missing injection run `6f239df8-0bc4-4f25-99b6-db8a65093a86`. The new run passes technical acceptance, has one session.ended event and cleanEnd true, and its spoken response matches the sixth pasted response. It introduces no unsupported cause, preserves insufficient diagnostic evidence wording and recommends neutral read-only checks.

Updated coverage after deduplication: empty 3/3, injection 3/3, refused 0/3, timeout 0/3, healthy 0/3. All six unique v5 captures pass technical and manual spoken-response review. Nine further captures are needed, three for each remaining scenario. The two targeted regressions are resolved in the observed samples; full v5 regression coverage remains pending.

## Updated export at 17:55:23 UTC

Preserved as `render-v5-captures-2026-09-20-175523.json`. Eight new v5 captures include seven technically valid investigations and one cleanly ended timeout attempt without a tool call or report. Combined unique technical coverage is now 13/15: refused 3/3, timeout 2/3, healthy 2/3, empty 3/3, injection 3/3.

The incomplete attempt `40912e6b-d6a2-4b6d-a47f-d237dc77cc21` transcribed the request as "Investigate." and then "6 times 102 errors." The agent asked for clarification rather than inventing a result. It does not count as a successful investigation; the transcript supports a recognition/turn-taking problem, not a backend diagnostic failure. One additional timeout and one healthy run are required for technical coverage.

All seven completed reports have expected status/cause, all validation flags true, cleanEnd true and a session.ended event. Healthy responses remain restricted to the checked window; interim waiting statements do not invent a diagnosis.

Spoken certainty caveat: refused evaluation `cd816351-9f2c-46eb-a9df-8fc754578b26` says "The incident was caused by" and timeout evaluation `046bc2d4-051f-4ab2-9f6e-91bc65aa4543` says "The incident is caused by". Their mechanisms match the canonical reports, but the phrasing strengthens a probable cause into a definitive claim. Record these as spoken-calibration issues; 13 technical passes must not be described as 13 fully compliant spoken responses. No prompt changes made during this review.

## Updated export at 18:01:51 UTC — technical coverage complete

Preserved as `render-v5-captures-2026-09-20-180151.json`. All six new captures (three timeout, three healthy) use prompt v5 and pass technical acceptance, with clean ends and one session.ended event each. The combined dataset has 20 unique attempts: 19 valid technical captures and one prior no-tool attempt. Coverage is refused 3, timeout 5, healthy 5, empty 3, injection 3. `render-v5-technical-matrix.json` selects the first three technically valid unique runs per scenario, yielding 15/15. Selection is chronological across the supplied exports and does not filter out spoken-quality findings. Average selected tool-request latency is 85.79 ms; sample p95 is 93.7 ms, not conversational latency.

The latest healthy responses remain bounded to the checked window. Timeout run `10be47b8-e20f-4efc-88d3-887ec714250b` again says "The incident is caused by". This confirms the remaining certainty-calibration issue rather than resolving it. The technical matrix is complete, but full spoken compliance and MVP READY are not claimed. Next: address certainty wording without inventing evidence, then validate the changed behavior. Hosted quota/concurrency checks and submission assets remain separate unfinished work.
