# Live voice evaluation 001

- Date: 2026-09-19
- Provider: AssemblyAI Voice Agent API
- Scenario selected: `refused`
- Result: partial pass

## Observed transcript

> VoiceOps: Hello, I am VoiceOps. Ask me why nginx is returning 502 errors.
>
> User: Hello.
>
> VoiceOps: Hello. How can I help you today?
>
> User: Ask me how nginx returns 502 errors.
>
> VoiceOps: Why is nginx returning 502 errors?
>
> VoiceOps later requested explicit confirmation before beginning an investigation.

## Evaluation

- Temporary token issuance: pass.
- Microphone input and user transcription: pass.
- Agent audio and transcript output: pass.
- Intent recognition: fail; the agent repeated an imperfectly phrased request.
- Required `investigate_nginx` tool call: fail.
- Canonical report in the voice path: not reached.
- Clean session end: not recorded in this artifact.

## Corrective action

Prompt version 2 treats any mention of nginx 502 errors as an immediate investigation request, explicitly handles imperfect phrasing, forbids confirmation loops, and requires the tool call before any causal answer. The next test phrase is `Investigate nginx 502 errors.`
