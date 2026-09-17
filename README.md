# Signal Mock Interviewer

A Next.js App Router starter for realistic voice-based software engineering interview practice.

## Architecture

- `app/page.tsx` renders setup and `app/interview/page.tsx` renders the interview room.
- `components/` contains interactive UI. The room talks to a provider-shaped hook, not an ElevenLabs API directly.
- `lib/voice/types.ts` defines the provider contract; `lib/voice/elevenlabs.ts` is the current adapter and can later be replaced by Retell, Vapi, or OpenAI realtime.
- `lib/interview/` owns configuration, question selection, and the reusable interviewer prompt.
- `data/questions.json` is validated with Zod. `lib/browser/research.ts` is the server-only Browserbase/Stagehand boundary.

There is no database, authentication, payments, or separate OpenAI integration yet. The data access functions are intentionally small so the question repository can move to Supabase later.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Fill `.env.local` with:

```bash
ELEVENLABS_API_KEY=your-elevenlabs-server-key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_...
BROWSERBASE_API_KEY=bb_...
```

Only the public agent ID reaches the browser. The other values remain server-only.

For a hosted deployment, add these variables in the hosting provider's project settings. Do not upload `.env.local`. Because `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is bundled at build time, redeploy after changing it.

## ElevenLabs setup

Create an ElevenLabs Agent, configure its voice and turn-taking, and put its ID in `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`. Copy the behavior in `lib/interview/prompts.ts` into the agent system prompt. The adapter handles microphone permission, start/end, status, transcript messages, mute, and errors.

## Questions

Add objects to `data/questions.json` with `id`, `company`, `role`, `interviewType`, `round`, `question`, hidden `topics`, `difficulty`, `sourceType`, `sourceNotes`, and ISO `dateAdded`. Valid source types are `asked_me`, `asked_friend`, `reported_online`, and `ai_generated`. `lib/schemas/question.ts` is the validation source.

## Research mode

`POST /api/browser/research` accepts `{ "company": "Example", "sourceUrl": "https://example.com/careers" }` and returns a structured company plus questions array containing question, interview type, topics, source URL, and confidence. The current function is intentionally stubbed until sources and model credentials are selected; Browserbase credentials never enter the browser.

## Adding another voice provider

Implement the `VoiceProvider` contract in `lib/voice/types.ts`, add a provider hook with the same lifecycle/status/transcript behavior, and update the composition point in `components/Interviewer.tsx`. The question bank, research route, and transcript UI remain provider-neutral.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Next Steps

1. Pass the selected question and hidden topics to the voice agent as session context.
2. Implement Stagehand extraction against an allowlist of interview sources.
3. Merge discovered questions in hybrid mode.
4. Add a session repository that can later be backed by Supabase.
5. Add evaluation and post-interview feedback.
