import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import ts from "typescript";

test("voice authorization reports permission failures, protects credentials, and handles valid sessions", async () => {
  const directory = await mkdtemp(join(tmpdir(), "signal-voice-"));
  const originalFetch = globalThis.fetch;
  const oldKey = process.env.ELEVENLABS_API_KEY;
  const oldAgent = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  try {
    const source = await readFile("app/api/voice/session/route.ts", "utf8");
    await writeFile(
      join(directory, "route.mjs"),
      ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    );
    const { POST } = await import(pathToFileURL(join(directory, "route.mjs")));
    process.env.ELEVENLABS_API_KEY = " sk_dummy_private_value ";
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = " agent_dummy ";
    for (const [status, code, expected] of [
      [401, "missing_permissions", /convai_write/],
      [400, "api_key_id_used_as_api_key", /key ID/],
      [401, "invalid_api_key", /rejected the API key/],
      [404, "not_found", /agent was not found/],
      [429, "rate_limit", /rate limiting/],
    ]) {
      globalThis.fetch = async (_url, options) => {
        assert.equal(options.headers["xi-api-key"], "sk_dummy_private_value");
        return Response.json(
          { detail: { status: code, message: "sk_dummy_private_value" } },
          { status },
        );
      };
      const response = await POST();
      const text = await response.text();
      assert.match(text, expected);
      assert(!text.includes("sk_dummy_private_value"));
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
    globalThis.fetch = async () =>
      Response.json({
        signed_url: "wss://api.elevenlabs.io/voice?token=dummy",
      });
    assert.equal(
      (await (await POST()).json()).signedUrl,
      "wss://api.elevenlabs.io/voice?token=dummy",
    );
    globalThis.fetch = async () => Response.json({ signed_url: null });
    assert.equal((await POST()).status, 502);
    globalThis.fetch = async () => {
      throw new DOMException("secret detail", "TimeoutError");
    };
    assert.equal((await POST()).status, 504);
    globalThis.fetch = async () => {
      throw new Error("sk_dummy_private_value");
    };
    assert(!(await (await POST()).text()).includes("sk_dummy_private_value"));
    delete process.env.ELEVENLABS_API_KEY;
    assert.equal((await POST()).status, 503);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = oldKey;
    if (oldAgent === undefined)
      delete process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    else process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID = oldAgent;
    await rm(directory, { recursive: true });
  }
});

test("microphone checks explain insecure origins and unsupported browsers before SDK startup", async () => {
  const directory = await mkdtemp(join(tmpdir(), "signal-microphone-"));
  try {
    const source = await readFile("lib/voice/microphone.ts", "utf8");
    await writeFile(
      join(directory, "microphone.mjs"),
      ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    );
    const { microphoneSupportError, microphoneStartupError } = await import(
      pathToFileURL(join(directory, "microphone.mjs"))
    );
    assert.match(
      microphoneSupportError(false, false),
      /http:\/\/localhost:3000/,
    );
    assert.match(microphoneSupportError(false, true), /HTTPS/);
    assert.match(microphoneSupportError(true, false), /browser/);
    assert.equal(microphoneSupportError(true, true), undefined);
    for (const [name, message] of [
      ["NotAllowedError", /blocked/],
      ["NotFoundError", /No microphone/],
      ["NotReadableError", /could not be opened/],
    ]) {
      assert.match(
        microphoneStartupError(new DOMException("Original error", name))
          .message,
        message,
      );
    }
    const unknown = new Error("Agent overrides are disabled");
    assert.equal(microphoneStartupError(unknown), unknown);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test("Sam's opening explains the interview and approach submissions contain the candidate's notes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "signal-opening-"));
  try {
    const source = await readFile("lib/interview/opening.ts", "utf8");
    await writeFile(
      join(directory, "opening.mjs"),
      ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    );
    const { buildInterviewOpening, buildApproachMessage } = await import(
      pathToFileURL(join(directory, "opening.mjs"))
    );
    const opening = buildInterviewOpening(
      { interviewType: "technical", duration: 30 },
      "Find a pair of prices that sums to the budget.",
    );
    assert.match(opening, /Sam/);
    assert.match(opening, /30 minutes/);
    assert.match(opening, /clarify/);
    assert.match(opening, /test cases/);
    assert.match(opening, /Find a pair/);
    const notes =
      "I will track previous values in a hash map and look for the complement.";
    const message = buildApproachMessage(notes);
    assert(message.includes(notes));
    assert.match(message, /follow-up/);
    assert.throws(() => buildApproachMessage("  "));
  } finally {
    await rm(directory, { recursive: true });
  }
});

test("voice startup awaits the real handshake, surfaces rejection, and sends candidate messages", async () => {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const React = await import("react");
  const { renderToString } = await import("react-dom/server");
  const directory = await mkdtemp(join(tmpdir(), "signal-connection-"));
  const originalFetch = globalThis.fetch;
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  try {
    await writeFile(
      join(directory, "sdk.mjs"),
      "export const VoiceConversation = { startSession: null };",
    );
    const sdk = await import(pathToFileURL(join(directory, "sdk.mjs")));
    const microphone = ts.transpileModule(
      await readFile("lib/voice/microphone.ts", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText;
    await writeFile(join(directory, "microphone.mjs"), microphone);
    const source = ts
      .transpileModule(await readFile("lib/voice/elevenlabs.ts", "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      })
      .outputText.replace('"@elevenlabs/react"', '"./sdk.mjs"')
      .replace(
        '"react"',
        JSON.stringify(pathToFileURL(require.resolve("react")).href),
      )
      .replace('"./microphone"', '"./microphone.mjs"');
    await writeFile(join(directory, "provider.mjs"), source);
    const { useElevenLabsProvider } = await import(
      pathToFileURL(join(directory, "provider.mjs"))
    );
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { isSecureContext: true },
    });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        mediaDevices: {
          getUserMedia() {
            throw new Error("Tests must not open a microphone");
          },
        },
      },
    });
    globalThis.fetch = async () =>
      Response.json({ signedUrl: "wss://api.elevenlabs.io/dummy" });
    let voice;
    function Probe() {
      voice = useElevenLabsProvider();
      return null;
    }
    renderToString(React.createElement(Probe));
    let rejectHandshake;
    sdk.VoiceConversation.startSession = () =>
      new Promise((_resolve, reject) => {
        rejectHandshake = reject;
      });
    let settled = false;
    const rejected = voice.start("prompt", "intro").finally(() => {
      settled = true;
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(settled, false);
    const rejection = assert.rejects(rejected, /overrides disabled/);
    rejectHandshake(new Error("overrides disabled"));
    await rejection;
    const messages = [];
    const volumes = [];
    let ended = false;
    sdk.VoiceConversation.startSession = async (options) => {
      assert.equal(options.textOnly, false);
      assert.equal(options.connectionType, "websocket");
      assert.equal(options.overrides.agent.firstMessage, "Hi, I am Sam");
      return {
        setVolume: ({ volume }) => volumes.push(volume),
        sendUserMessage: (text) => messages.push(text),
        sendContextualUpdate() {},
        async endSession() {
          ended = true;
        },
      };
    };
    await voice.start("Interview prompt", "Hi, I am Sam");
    voice.sendMessage("My approach is to use a hash map.");
    assert.deepEqual(messages, ["My approach is to use a hash map."]);
    assert.deepEqual(volumes, [1]);
    await voice.end();
    assert(ended);
    assert.throws(() => voice.sendMessage("late"), /Connect Sam/);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else delete globalThis.window;
    if (oldNavigator)
      Object.defineProperty(globalThis, "navigator", oldNavigator);
    else delete globalThis.navigator;
    await rm(directory, { recursive: true });
  }
});
