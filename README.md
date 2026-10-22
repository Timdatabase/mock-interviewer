# Signal Mock Interviewer

Voice-based coding, behavioral, and system design interview practice, built with Next.js 16 and ElevenLabs.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Choose an interview type, topics, problem difficulty, target level, and session length. Enter the room and select a random question. Start voice or practice without voice. Share code and notes with the interviewer at checkpoints, then end the session for guided reflection and a downloadable JSON record.

## Voice configuration

Set `ELEVENLABS_API_KEY` and `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` in `.env.local`. The server obtains a short-lived signed WebSocket URL; the API key never reaches the browser.

In your ElevenLabs agent's Security settings, enable **system prompt** and **first message** overrides. The app sends the chosen problem, target role, level, duration, and interview behavior as session overrides. Without these permissions, startup can fail. Configure the agent's voice and turn-taking in ElevenLabs. Voice sessions and explicitly shared code/notes are processed by ElevenLabs.

References: [signed URLs](https://elevenlabs.io/docs/api-reference/conversations/get-signed-url), [session overrides](https://elevenlabs.io/docs/eleven-agents/customization/personalization/overrides).

## Question bank

`data/questions.json` contains 18 original prompts: nine coding, six behavioral, and three system design. Some link to related LeetCode practice; there is no live LeetCode import or scraped catalog.

Add questions using `lib/schemas/question.ts` as the schema. Fields include `id`, `title`, `question`, `company`, `role`, `interviewType`, `round`, `difficulty` (candidate seniority), `problemDifficulty` (easy/medium/hard), `tags`, hidden `topics`, `examples`, `constraints`, `sourceType`, `sourceNotes`, `dateAdded`, and optional `sourceUrl`.

Selection runs on the server with uniform randomness across matching questions. Selected topics use **any matching topic**. Generic questions supplement company filters; the starter bank is general practice and does not claim company-specific interview provenance. Candidate seniority guides interviewer behavior; it does not restrict the coding problem pool. Questions never repeat within a session. Recent browser history is preferred against, with an explicit fallback when all remaining matches were recently practiced. Unmatched filters show a useful error instead of silently changing the criteria.

Only public problem fields reach the browser. Internal topics and source notes remain in the server bank. The voice prompt uses public problem information rather than exposing private solutions or rubrics.

## Session behavior and limits

- Animated SVG interviewer has idle, connecting, listening, and speaking states, with reduced-motion support.
- Coding workspace supports language selection and explicit code-sharing checkpoints. It is a plain-text editor; it does not execute code or verify tests.
- Behavioral and system design sessions use a notes workspace and distinct interview guidance.
- Phase controls guide clarification, approach, work, and reflection. The timer is advisory and does not abruptly disconnect voice.
- Review includes saved work, candidate transcript excerpts, type-specific self-review prompts, and export. It is guided self-assessment, not automated grading.
- Recent question IDs stay in local storage. Session work stays in memory until exported; refreshing or leaving loses it.
- Research extraction remains an unconnected stub. There is no authentication, database, live import, or sandboxed code execution. Add authentication and usage controls before making a credential-backed voice deployment broadly available.

## Architecture

- `components/InterviewSetup.tsx`: interview settings and topic filters.
- `components/Interviewer.tsx`: session lifecycle, workspace, checkpoints, transcript, and review.
- `components/Avatar.tsx`: code-native animated interviewer.
- `lib/interview/config.ts`: shared validated settings.
- `lib/interview/questions.ts`: server-only repository and public question projection.
- `app/api/interview/question/route.ts`: validated, nonrepeating random selection.
- `app/api/voice/session/route.ts`: server-only ElevenLabs authorization.
- `lib/voice/`: provider contract and ElevenLabs adapter.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

If Turbopack cannot spawn its CSS worker in a restricted environment, use `npm run build -- --webpack`. The existing Google font integration needs network access during the build.

Verified through production HTTP checks: setup and interview rendering, topic/difficulty filters, behavioral and system design selection, within-session repeat prevention, recent-history preference, public-field projection, and invalid/empty configuration handling. Live microphone interaction requires manual verification with a configured ElevenLabs agent.
