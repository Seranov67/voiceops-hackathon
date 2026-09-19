# Hackathon requirements review — September 19, 2026

## Confirmed from official lablab.ai pages

- The AssemblyAI Voice Agent Hackathon runs September 1–30, 2026 and entries must use AssemblyAI.
- A complete lablab.ai entry requires an online working prototype, a video presentation, and a pitch deck.
- General lablab.ai guidance also lists a public GitHub repository, an application URL, a cover image, an MP4 video up to five minutes, and a PDF slide deck.
- The general lablab.ai judging dimensions are application of technology, presentation, business value, and originality.

Sources:

- https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon
- https://lablab.ai/guide
- https://lablab.ai/guide/ai-hackathons
- https://lablab.ai/guide/how-to-win-an-ai-hackathon

## Still unconfirmed for this event

- Exact submission time and time zone.
- Event-specific judging weights or additional criteria.
- Whether a specific AssemblyAI API is mandatory.
- Rules for reusing pre-existing AI functionality.
- MIT or other specific license requirements.

The full rules pages did not expose their content through automated extraction. These items must be checked in the browser or confirmed with organizers. Do not apply rules from unrelated lablab.ai events. The internal submission target is September 29; this is not the official deadline.

## Product alignment

- **Application of technology:** a real AssemblyAI voice session invokes a constrained diagnostic tool and receives a validated report.
- **Business value:** a focused first-pass workflow for an on-call SRE investigating nginx 502 failures.
- **Originality:** exact evidence provenance, read-only capabilities, and prompt-injection regression tests.
- **Presentation:** one understandable path from a spoken question to a sourced incident report.

## MVP boundary

Five synthetic scenarios: connection refused, upstream timeout, no incident observed, empty evidence, and prompt injection. Fixtures come first. Loki is optional after the voice fixture path is stable. Prometheus, TeamSync, infrastructure mutation, and production data are outside the initial MVP.
