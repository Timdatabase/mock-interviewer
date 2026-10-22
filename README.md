# Signal Mock Interviewer

Voice-based coding, behavioral, and system design interview practice, built with Next.js 16 and ElevenLabs.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Choose an interview type, topics, problem difficulty, target level, and session length. Enter the room and select a random question. Start voice or practice without voice. Write JavaScript in the editor and run the visible tests. Sam follows your workspace automatically while voice is connected; use Discuss with Sam, hint controls, or the message box to request a response. End the session for guided reflection and a downloadable JSON record.

## Voice configuration

Set `ELEVENLABS_API_KEY` and `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` in `.env.local`. The server obtains a short-lived signed WebSocket URL; the API key never reaches the browser.

In your ElevenLabs agent's Security settings, enable **system prompt** and **first message** overrides. The app sends the chosen problem, target role, level, duration, and interview behavior as session overrides. Without these permissions, startup can fail. Configure the agent's voice and turn-taking in ElevenLabs. Voice sessions and explicitly shared code/notes are processed by ElevenLabs.

References: [signed URLs](https://elevenlabs.io/docs/api-reference/conversations/get-signed-url), [session overrides](https://elevenlabs.io/docs/eleven-agents/customization/personalization/overrides).

## Bring your own questions

In the interview room, open **Bring your own questions**. Paste a single prompt to practice it directly, or paste up to 30 prompts separated by a line containing `---`. Loading a bank picks a question immediately; the next-question button randomly selects from the remaining prompts without repeats. The bank uses the interview type chosen at setup, so keep coding and behavioral prompts in separate sessions.

Custom coding prompts get a `solve(...args)` starter function. In Test cases, provide JSON cases with `name`, `args`, and `expected` fields. For example, a staircase question could use `[{"name":"Four steps","args":[4],"expected":5}]`. Custom prompts and work stay in session memory until you export the session; a refresh loses them.

## Question bank

`data/questions.json` contains 18 original prompts: nine coding, six behavioral, and three system design. Some link to related LeetCode practice; there is no live LeetCode import or scraped catalog.

Add questions using `lib/schemas/question.ts` as the schema. Fields include `id`, `title`, `question`, `company`, `role`, `interviewType`, `round`, `difficulty` (candidate seniority), `problemDifficulty` (easy/medium/hard), `tags`, hidden `topics`, `examples`, `constraints`, `sourceType`, `sourceNotes`, `dateAdded`, and optional `sourceUrl`.

Selection runs on the server with uniform randomness across matching questions. Selected topics use **any matching topic**. Generic questions supplement company filters; the starter bank is general practice and does not claim company-specific interview provenance. Candidate seniority guides interviewer behavior; it does not restrict the coding problem pool. Questions never repeat within a session. Recent browser history is preferred against, with an explicit fallback when all remaining matches were recently practiced. Unmatched filters show a useful error instead of silently changing the criteria.

Coding questions include JavaScript starter functions and editable visible tests. Only public problem fields reach the browser. Internal topics and source notes remain in the server bank. The voice prompt uses public problem information rather than exposing private solutions or rubrics.

## Session behavior and limits

- Animated SVG interviewer has idle, connecting, listening, and speaking states, with reduced-motion support.
- CodeMirror editor includes syntax highlighting, line numbers, bracket matching, autocomplete, and a separate tests/output panel.
- JavaScript runs locally in a QuickJS WebAssembly sandbox inside a dedicated worker. Each run gets a fresh runtime with a 2-second execution limit, 16 MB guest heap, bounded stack, captured console output, and a Stop control. The guest has no browser, network, filesystem, or server APIs. The outer worker timeout also covers startup failures. Synchronous functions only; other languages and imports are not supported.
- Results show actual versus expected output and distinguish stale runs after edits. Pair-sum and dependency-order cases accept alternative valid answers. Visible tests provide evidence, not complete grading.
- With voice connected, automatic workspace updates send current code, notes, cursor line, phase, and test results after an editing pause and at spoken turns. The toggle stops automatic sharing; explicit discussion actions still share the workspace. Context updates inform future responses without interrupting typing. Explicit messages use the SDK's user-message method to request an interviewer turn.
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
npx tsc --noEmit
npm run build
```

If Turbopack cannot spawn its CSS worker in a restricted environment, use `npm run build -- --webpack`. The existing Google font integration needs network access during the build.

Runner tests exercise all built-in coding cases, alternative valid outputs, syntax/runtime failures, timeout recovery, memory/stack limits, isolation, logging, async rejection, and custom inputs. Verified through production HTTP checks: setup and interview rendering, topic/difficulty filters, behavioral and system design selection, within-session repeat prevention, recent-history preference, public-field projection, and invalid/empty configuration handling. Live microphone interaction requires manual verification with a configured ElevenLabs agent.
