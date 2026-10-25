# Signal Mock Interviewer

Voice-based coding, AI-assisted coding, behavioral, and system design interview practice, built with Next.js 16 and ElevenLabs.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 on the computer running the app. Microphone access requires localhost or HTTPS; a plain HTTP network IP will not expose microphone APIs. Choose an interview type, topics, problem difficulty, target level, and session length. Enter the room and select a random question. Start voice or practice without voice. Choose Python, JavaScript, or TypeScript in the editor header. Each language keeps its own draft. Write your solution and run the visible tests. Sam follows your workspace automatically while voice is connected; use Discuss with Sam, hint controls, or the message box to request a response. End the session for guided reflection and a downloadable JSON record.

## Voice configuration

Set `ELEVENLABS_API_KEY` and `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` in `.env.local`. The server obtains a short-lived signed WebSocket URL; the API key never reaches the browser.

Give the API key **ElevenAgents → Write** (`convai_write`). In your ElevenLabs agent's Security settings, enable **system prompt** and **first message** overrides. The app sends the chosen problem, target role, level, duration, and interview behavior as session overrides. Without these permissions, startup can fail. Configure the agent's voice and turn-taking in ElevenLabs. Sam opens with an introduction, explains the format, presents the problem, and invites clarifying questions. Voice sessions and explicitly shared code/notes are processed by ElevenLabs.

References: [signed URLs](https://elevenlabs.io/docs/api-reference/conversations/get-signed-url), [session overrides](https://elevenlabs.io/docs/eleven-agents/customization/personalization/overrides).

## AI-assisted coding practice

Select **AI-assisted** during setup. This round uses five original, single-file product tasks: pagination repair, duplicate webhook processing, layered settings, resilient log summaries, and capped retry scheduling. Each has Python, JavaScript, and TypeScript starter code and runnable visible tests.

- **Sam / interviewer:** voice conversation about clarification, delegation, review, verification, and ownership of the final code.
- **Patch / coding partner:** a separate OpenAI text assistant in the AI partner tab. It can plan, implement, debug, or review, including proposing a complete solution.
- Review the proposed replacement before applying it. A suggestion cannot overwrite code edited since its request, or a different programming language. Undo is available while the applied code remains unchanged. Run tests yourself after applying code.
- AI prompts, replies, applied changes, and undos are recorded in the session review/export. Sam receives concise observations when connected. These are evidence for discussion, not an automated hiring score.

Set these **server-only** variables in `.env.local`, then restart the dev server:

```bash
OPENAI_API_KEY=your-secret-api-key
OPENAI_ASSISTANT_MODEL=gpt-6-astra
```

The model can be changed using `OPENAI_ASSISTANT_MODEL`. No OpenAI key reaches the browser. The first version uses the Responses API with structured output and `store: false`. Only requests you initiate go to OpenAI, containing the task, current code, notes, visible test summary, and bounded conversation history. The key is not part of that context. Missing credentials, unavailable models, quota/rate limits, refusals, timeouts, and invalid replies have explicit error states.

The partner has no terminal, filesystem, browser, external tools, or automatic execution. It proposes a replacement for the single-file solution; the existing local runner remains the source of actual test results. Each request caps output at 5,000 tokens and times out after 60 seconds. Session state remains in browser memory until exported.

This practice format draws on [Canva's description of AI-assisted interviews](https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/), which emphasizes realistic work, critical review, and verification, and [CodeSignal's full co-pilot mode](https://codesignal.com/blog/introducing-ai-assisted-coding-assessments-interviews/). Tasks are original practice exercises, not copied employer questions. The integration follows the official [OpenAI code-generation](https://developers.openai.com/api/docs/guides/code-generation) and [structured-output](https://developers.openai.com/api/docs/guides/structured-outputs) guidance.

## Bring your own questions

In the interview room, open **Bring your own questions**. Paste a single prompt to practice it directly, or paste up to 30 prompts (50,000 characters each, 500,000 per batch) separated by a line containing `---`. Loading a bank picks a question immediately; the next-question button randomly selects from the remaining prompts without repeats. The bank uses the interview type chosen at setup, so keep coding and behavioral prompts in separate sessions.

Custom coding prompts get a language-appropriate `solve` starter function. In Test cases, provide JSON cases with `name`, `args`, and `expected` fields. For example, a staircase question could use `[{"name":"Four steps","args":[4],"expected":5}]`. Custom prompts and work stay in session memory until you export the session; a refresh loses them.

## Question bank

`data/questions.json` contains 18 original prompts: nine coding, six behavioral, and three system design. `data/ai-tasks.json` adds five AI-assisted practical coding tasks. Some link to related LeetCode practice; there is no live LeetCode import or scraped catalog.

Add questions using `lib/schemas/question.ts` as the schema. Fields include `id`, `title`, `question`, `company`, `role`, `interviewType`, `round`, `difficulty` (candidate seniority), `problemDifficulty` (easy/medium/hard), `tags`, hidden `topics`, `examples`, `constraints`, `sourceType`, `sourceNotes`, `dateAdded`, and optional `sourceUrl`.

Selection runs on the server with uniform randomness across matching questions. Selected topics use **any matching topic**. Generic questions supplement company filters; the starter bank is general practice and does not claim company-specific interview provenance. Candidate seniority guides interviewer behavior; it does not restrict the coding problem pool. Questions never repeat within a session. Recent browser history is preferred against, with an explicit fallback when all remaining matches were recently practiced. Unmatched filters show a useful error instead of silently changing the criteria.

Coding questions include JavaScript starter functions and editable visible tests. Only public problem fields reach the browser. Internal topics and source notes remain in the server bank. The voice prompt uses public problem information rather than exposing private solutions or rubrics.

## Session behavior and limits

- Animated SVG interviewer has idle, connecting, listening, and speaking states, with reduced-motion support.
- The desktop room stays within the viewport, with independent panel scrolling and Code & tests, My approach, and Conversation tabs. Small screens also have a Question tab.
- Write your reasoning in My approach and use Send approach. The actual note text is sent as a candidate message and appears in Conversation. If disconnected, the action offers to connect Sam first.
- CodeMirror editor includes Python/JavaScript/TypeScript selection, syntax highlighting, line numbers, bracket matching, autocomplete, and a separate tests/output panel.
- JavaScript runs locally in a QuickJS WebAssembly sandbox inside a dedicated worker. Each run gets a fresh runtime with a 2-second execution limit, 16 MB guest heap, bounded stack, captured console output, and a Stop control. The guest has no browser, network, filesystem, or server APIs. The outer worker timeout also covers startup failures. Synchronous functions only. TypeScript is transpiled before running in the same sandbox; this removes types but does not perform type checking. Source code allows up to 100,000 characters.
- Python uses a local Pyodide runtime in a worker owned by a sandboxed, opaque-origin frame. CSP restricts requests to public runtime assets, preventing access to app API endpoints. Initialization has a separate 45-second timeout; computation has a 2.5-second hard timeout and Stop control. The Python runtime has a larger browser memory footprint than QuickJS and no equivalent 16 MB guest heap cap. External packages are not installed automatically.
- `npm run dev` and `npm run build` prepare Python assets from the installed package; restart the dev server after updating dependencies. The first Python run loads the runtime; browser caching speeds up subsequent loads.
- Results show actual versus expected output and distinguish stale runs after edits. Pair-sum and dependency-order cases accept alternative valid answers. Visible tests provide evidence, not complete grading.
- With voice connected, automatic workspace updates send current code, notes, cursor line, phase, and test results after an editing pause and at spoken turns. The toggle stops automatic sharing; explicit discussion actions still share the workspace. Context updates inform future responses without interrupting typing. Explicit messages use the SDK's user-message method to request an interviewer turn.
- Speaker volume, output activity, Enable speaker, and Repeat introduction controls help diagnose playback. Startup awaits the underlying voice client's connection promise so handshake errors are visible.
- Behavioral and system design sessions use a notes workspace and distinct interview guidance.
- Phase controls guide clarification, approach, work, and reflection. The timer is advisory and does not abruptly disconnect voice.
- Review includes saved work, candidate transcript excerpts, type-specific self-review prompts, and export. It is guided self-assessment, not automated grading.
- Recent question IDs stay in local storage. Session work stays in memory until exported; refreshing or leaving loses it.
- Research extraction remains an unconnected stub. There is no authentication, database, or live import. Add authentication and usage controls before making a credential-backed voice deployment broadly available.

## Architecture

- `components/InterviewSetup.tsx`: interview settings and topic filters.
- `components/Interviewer.tsx`: session lifecycle, workspace, checkpoints, transcript, and review.
- `components/Avatar.tsx`: code-native animated interviewer.
- `components/CodeWorkspace.tsx` and `CodeEditor.tsx`: editor, custom tests, local execution, and output.
- `components/CustomQuestionBank.tsx`: single or batch prompt entry.
- `components/CodingPartner.tsx`: AI chat, reviewable code proposals, and guarded application/undo.
- `lib/assistant/` and `app/api/assistant/route.ts`: validated, server-only OpenAI integration.
- `lib/runner/`: isolated QuickJS execution, worker lifecycle, and output validation.
- `lib/interview/use-awareness.ts`: debounced and speech-triggered workspace observations.
- `lib/interview/config.ts`: shared validated settings.
- `lib/interview/questions.ts`: server-only repository and public question projection.
- `app/api/interview/question/route.ts`: validated, nonrepeating random selection.
- `app/api/voice/session/route.ts`: server-only ElevenLabs authorization.
- `lib/voice/`: provider contract and ElevenLabs adapter.

## Verification

```bash
npm run lint
npm run test:runner
npm run test:voice
npm run test:assistant
npx tsc --noEmit
npm run build
```

If Turbopack cannot spawn its CSS worker in a restricted environment, use `npm run build -- --webpack`. The existing Google font integration needs network access during the build.

Runner tests exercise all built-in coding cases, alternative valid outputs, syntax/runtime failures, timeout recovery, memory/stack limits, isolation, logging, async rejection, and custom inputs. Verified through production HTTP checks: setup and interview rendering, topic/difficulty filters, behavioral and system design selection, within-session repeat prevention, recent-history preference, public-field projection, and invalid/empty configuration handling. Live microphone interaction requires manual verification with a configured ElevenLabs agent.
