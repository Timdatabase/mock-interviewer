import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import variant from "@jitl/quickjs-singlefile-browser-release-sync";
const require = createRequire(import.meta.url);
const directory = await mkdtemp(join(tmpdir(), "signal-assistant-"));
after(() => rm(directory, { recursive: true }));
const files = [
  ["lib/assistant/schema.ts", "schema"],
  ["lib/assistant/prompt.ts", "prompt"],
  ["lib/assistant/service.ts", "service"],
  ["lib/assistant/proposals.ts", "proposals"],
  ["lib/interview/config.ts", "config"],
  ["lib/schemas/question.ts", "question-schema"],
  ["lib/runner/engine.ts", "engine"],
  ["lib/runner/validate.ts", "validate"],
  ["lib/interview/limits.ts", "limits"],
  ["lib/runner/python-program.ts", "python-program"],
];
for (const [file, name] of files) {
  let source = ts.transpileModule(await readFile(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  source = source.replaceAll(
    '"zod"',
    JSON.stringify(pathToFileURL(require.resolve("zod")).href),
  );
  for (const relative of ["schema", "prompt", "validate", "limits"])
    source = source.replaceAll(`"./${relative}"`, `"./${relative}.mjs"`);
  source = source.replaceAll('"../interview/limits"', '"./limits.mjs"');
  await writeFile(join(directory, name + ".mjs"), source);
}
const { handleAssistant } = await import(
  pathToFileURL(join(directory, "service.mjs"))
);
const { canApplyProposal, partnerHistory } = await import(
  pathToFileURL(join(directory, "proposals.mjs"))
);
const { configSchema, isCodingInterview } = await import(
  pathToFileURL(join(directory, "config.mjs"))
);
const { interviewQuestionListSchema } = await import(
  pathToFileURL(join(directory, "question-schema.mjs"))
);
const tasks = interviewQuestionListSchema.parse(
  JSON.parse(await readFile("data/ai-tasks.json", "utf8")),
);
const requestBody = {
  mode: "ai-assisted",
  task: {
    id: "task",
    title: "Task",
    question: "Implement a capped retry schedule.",
  },
  language: "javascript",
  code: "function solve(){return []}",
  notes: "I will check cap behavior.",
  latestRun: "Not run yet",
  prompt: "Help me implement this.",
  history: [],
};
const request = (body = requestBody, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
const reply = {
  message: "Here is a proposed implementation. Review the cap behavior.",
  proposedCode: "function solve(){return [1]}",
  checks: ["Run a zero-attempt case."],
  assumptions: ["The cap is inclusive."],
};
const upstreamReply = (data) =>
  Response.json({
    status: "completed",
    output: [
      {
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify(data) }],
      },
    ],
    usage: { input_tokens: 10, output_tokens: 20 },
  });

const { execute } = await import(pathToFileURL(join(directory, "engine.mjs")));
const quickjs = await newQuickJSWASMModuleFromVariant(variant);

test("coding partner uses server-only credentials, bounded structured output, and workspace context", async () => {
  let called = false;
  const response = await handleAssistant(request(), {
    apiKey: " sk_dummy_private ",
    fetcher: async (url, options) => {
      called = true;
      assert.equal(url, "https://api.openai.com/v1/responses");
      assert.equal(options.headers.Authorization, "Bearer sk_dummy_private");
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.equal(body.max_output_tokens, 5000);
      assert.equal(body.text.format.strict, true);
      assert.equal(body.tools, undefined);
      assert.equal(body.model, "gpt-6-astra");
      assert.match(body.instructions, /Full AI assistance is allowed/);
      assert.match(body.input.at(-1).content, /function solve/);
      return upstreamReply(reply);
    },
  });
  assert(called);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const data = await response.json();
  assert.deepEqual(data.reply, reply);
  assert.equal(data.usage.outputTokens, 20);
  assert(!JSON.stringify(data).includes("sk_dummy_private"));
});
test("missing key, invalid requests, cross-origin calls and oversized bodies never reach OpenAI", async () => {
  const fetcher = () => {
    throw new Error("Must not call OpenAI");
  };
  assert.equal((await handleAssistant(request(), { fetcher })).status, 503);
  assert.equal(
    (
      await handleAssistant(request({ ...requestBody, mode: "technical" }), {
        apiKey: "dummy",
        fetcher,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await handleAssistant(request({ ...requestBody, language: "ruby" }), {
        apiKey: "dummy",
        fetcher,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await handleAssistant(
        request({ ...requestBody, code: "x".repeat(100001) }),
        { apiKey: "dummy", fetcher },
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleAssistant(request(requestBody, "https://other.example"), {
        apiKey: "dummy",
        fetcher,
      })
    ).status,
    403,
  );
  const oversized = new Request("http://localhost:3000/api/assistant", {
    method: "POST",
    body: "x".repeat(1000001),
  });
  assert.equal(
    (await handleAssistant(oversized, { apiKey: "dummy", fetcher })).status,
    413,
  );
});
test("provider failures and refusals are actionable and do not expose raw error details", async () => {
  for (const status of [401, 404, 429, 500]) {
    const response = await handleAssistant(request(), {
      apiKey: "sk_dummy_private",
      fetcher: async () =>
        Response.json(
          {
            error: { message: "sk_dummy_private", code: "insufficient_quota" },
          },
          { status },
        ),
    });
    assert.equal(response.status, status === 429 ? 429 : 502);
    assert(!(await response.text()).includes("sk_dummy_private"));
  }
  assert.equal(
    (
      await handleAssistant(request(), {
        apiKey: "dummy",
        fetcher: async () =>
          Response.json({
            output: [
              {
                type: "message",
                content: [{ type: "refusal", refusal: "No" }],
              },
            ],
          }),
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await handleAssistant(request(), {
        apiKey: "dummy",
        fetcher: async () => Response.json({ status: "incomplete" }),
      })
    ).status,
    502,
  );
  assert.equal(
    (
      await handleAssistant(request(), {
        apiKey: "dummy",
        fetcher: async () => upstreamReply({ message: "missing fields" }),
      })
    ).status,
    502,
  );
  assert.equal(
    (
      await handleAssistant(request(), {
        apiKey: "dummy",
        fetcher: async () => {
          throw new DOMException("timeout", "TimeoutError");
        },
      })
    ).status,
    504,
  );
});
test("proposals cannot overwrite later edits or another language, and history stays bounded", () => {
  const proposal = { baseCode: "old", code: "new", language: "python" };
  assert(canApplyProposal(proposal, "old", "python"));
  assert(!canApplyProposal(proposal, "edited", "python"));
  assert(!canApplyProposal(proposal, "old", "javascript"));
  assert(!canApplyProposal(proposal, "new", "python"));
  const history = partnerHistory(
    Array.from({ length: 12 }, (_, i) => ({
      role: "user",
      text: String(i) + "x".repeat(7000),
    })),
  );
  assert.equal(history.length, 8);
  assert(history.every((message) => message.text.length === 6000));
  assert(history[0].text.startsWith("4"));
});
test("AI-assisted config validates as coding, and five original task contracts are available", () => {
  const config = configSchema.parse({
    interviewType: "ai-assisted",
    tags: ["debugging"],
  });
  assert(isCodingInterview(config.interviewType));
  assert(!isCodingInterview("behavioral"));
  assert.equal(tasks.length, 5);
  assert(
    tasks.every(
      (task) =>
        task.interviewType === "ai-assisted" &&
        task.starterCodes.python &&
        task.starterCodes.typescript &&
        task.testCases.length >= 4,
    ),
  );
});
const javascript = {
  "ai-pagination":
    "function solve(items,page,pageSize){page=Number.isInteger(page)&&page>0?page:1;pageSize=Number.isInteger(pageSize)&&pageSize>0?pageSize:10;const totalPages=Math.ceil(items.length/pageSize);return {totalPages,page,items:items.slice((page-1)*pageSize,page*pageSize),hasNext:page<totalPages,hasPrevious:page>1&&totalPages>0}}",
  "ai-webhooks":
    'function solve(events){const seen=new Set,totals=new Map,appliedIds=[];for(const e of events){if(!e||Array.isArray(e)||typeof e!=="object"||typeof e.id!=="string"||!e.id.length||typeof e.account!=="string"||!e.account.length||!Number.isInteger(e.amountCents)||seen.has(e.id))continue;seen.add(e.id);appliedIds.push(e.id);totals.set(e.account,(totals.get(e.account)||0)+e.amountCents)}return {appliedIds,totals:Object.fromEntries(totals)}}',
  "ai-config":
    'function solve(defaults,overrides){const obj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);function merge(a,b){if(!obj(b))return JSON.parse(JSON.stringify(b));const out=obj(a)?JSON.parse(JSON.stringify(a)):{};for(const key of Object.keys(b))out[key]=merge(obj(a)?a[key]:undefined,b[key]);return out}return merge(defaults,overrides)}',
  "ai-logs":
    'function solve(lines){let groups=new Map;for(const line of lines){let r;try{r=JSON.parse(line)}catch{continue}if(!r||Array.isArray(r)||typeof r.service!=="string"||!r.service.length||!["info","warn","error"].includes(r.level)||typeof r.latencyMs!=="number"||!Number.isFinite(r.latencyMs)||r.latencyMs<0)continue;let g=groups.get(r.service)||{service:r.service,requests:0,errors:0,sum:0};g.requests++;g.errors+=r.level==="error"?1:0;g.sum+=r.latencyMs;groups.set(r.service,g)}return [...groups.values()].sort((a,b)=>a.service<b.service?-1:a.service>b.service?1:0).map(g=>({service:g.service,requests:g.requests,errors:g.errors,averageLatencyMs:Math.floor(g.sum/g.requests+0.5)}))}',
  "ai-retries":
    "function solve(attempts,baseDelayMs,maxDelayMs){return Array.from({length:attempts},(_,i)=>Math.min(maxDelayMs,baseDelayMs*2**i))}",
};

for (const task of tasks)
  test(`${task.id}: starter exposes a real gap; implementation passes every visible test`, () => {
    const baseline = execute(quickjs, {
      code: task.starterCode,
      questionId: task.id,
      tests: task.testCases,
    });
    assert(baseline.error || baseline.cases.some((result) => !result.passed));
    const result = execute(quickjs, {
      code: javascript[task.id],
      questionId: task.id,
      tests: task.testCases,
    });
    assert(!result.error);
    assert(
      result.cases.every((result) => result.passed),
      JSON.stringify(result),
    );
  });
test("Python and TypeScript use the same practical task contracts", async () => {
  const { loadPyodide } = await import("pyodide");
  const python = await loadPyodide();
  const { pythonProgram } = await import(
    pathToFileURL(join(directory, "python-program.mjs"))
  );
  const { matchesOutput } = await import(
    pathToFileURL(join(directory, "validate.mjs"))
  );
  const task = tasks.find((task) => task.id === "ai-pagination");
  const source =
    'def solve(items, page, pageSize):\n    import math\n    page = page if type(page) is int and page > 0 else 1\n    pageSize = pageSize if type(pageSize) is int and pageSize > 0 else 10\n    total = math.ceil(len(items) / pageSize)\n    return {"page": page, "items": items[(page-1)*pageSize:page*pageSize], "hasNext": page < total, "hasPrevious": page > 1 and total > 0, "totalPages": total}\n';
  const result = JSON.parse(
    python.runPython(
      pythonProgram({
        code: source,
        questionId: task.id,
        tests: task.testCases,
      }),
    ),
  );
  assert(
    result.cases.every((test, index) =>
      matchesOutput(
        task.id,
        task.testCases[index].args,
        test.actual,
        task.testCases[index].expected,
      ),
    ),
  );
  const { transform } = await import("sucrase");
  const typed = javascript["ai-retries"].replace(
    "function solve(attempts,baseDelayMs,maxDelayMs)",
    "function solve(attempts:number,baseDelayMs:number,maxDelayMs:number):number[]",
  );
  const retry = tasks.find((task) => task.id === "ai-retries");
  assert(
    execute(quickjs, {
      code: transform(typed, { transforms: ["typescript"] }).code,
      questionId: retry.id,
      tests: retry.testCases,
    }).cases.every((test) => test.passed),
  );
});
