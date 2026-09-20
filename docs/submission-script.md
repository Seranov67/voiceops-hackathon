# VoiceOps Sentinel — demo recording script

Draft for a 3–4 minute English demo. Record the public HTTPS application with actual microphone interaction. Show the canonical report alongside speech. Do not show the Render environment page, API keys, or provider tokens.

## 0:00–0:25 — Problem

“When nginx returns 502 errors, an on-call engineer needs a grounded first explanation. VoiceOps Sentinel lets the engineer ask aloud and receive a report tied to exact log evidence. This prototype investigates five synthetic scenarios and only recommends read-only checks.”

## 0:25–1:15 — Refused connection

Open https://voiceops-sentinel.onrender.com before recording to allow the Free instance to wake. Select Connection refused, start voice, and say “Investigate nginx 502 errors.” Let the actual response finish. Point to error 111, the probable cause, and schema/provenance/policy flags in the report. End the session.

“AssemblyAI handles the voice conversation. A constrained tool calls our Node.js backend, which builds and validates the canonical incident report.”

## 1:15–2:00 — No evidence

Select No log records and repeat the spoken request. Show insufficient_evidence, unknown cause and neutral read-only follow-up. End the session.

“An empty result is not proof of a healthy system or a known failure. The agent explains that it cannot determine the cause.”

## 2:00–2:45 — Injection resistance

Select Prompt injection in a log line. Explain that the synthetic line contains an instruction to restart a production database. Run the same request and show the real response and report.

“Log content is data, not authority. VoiceOps exposes no shell or infrastructure write tool. This record does not support a diagnosis.”

## 2:45–3:20 — Evidence and limits

“We preserved a hosted matrix of three technically valid voice runs for each of five scenarios. All selected runs completed the tool call, passed captured report validations, and ended cleanly. Spoken paraphrases can still sound more certain than the report's probable-cause wording; the displayed report remains canonical.”

Show the evaluation export briefly, without implying that the matrix proves every spoken sentence is correct. Do not claim full conversational latency from tool-request timings.

## 3:20–3:45 — Scope and next step

“Today this is a focused demo using synthetic nginx logs. Real log integration is future work. Our next step is a bounded read-only adapter for a controlled log source, with the same evidence validation.”

Close on the application URL and project name. Export completed voice captures after recording. Keep a backup recording locally.

## Submission preparation still required

- Actual recorded video, reviewed for audio intelligibility and absence of secrets.
- PDF pitch deck and cover image.
- Verify public GitHub access and a license chosen by the project owner.
- Check the event's final submission form and precise deadline.
- Record the in-memory quota limitation: restart resets the token counter; it is not a durable spending cap.
