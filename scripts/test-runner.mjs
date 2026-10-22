import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import variant from "@jitl/quickjs-singlefile-browser-release-sync";
const directory = await mkdtemp(join(tmpdir(), "signal-runner-"));
for (const [source, output] of [
  ["lib/runner/validate.ts", "validate"],
  ["lib/runner/engine.ts", "engine"],
  ["lib/runner/tests.ts", "tests"],
  ["lib/interview/custom.ts", "custom"],
]) {
  const code = ts
    .transpileModule(await readFile(source, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    })
    .outputText.replace('"./validate"', '"./validate.mjs"');
  await writeFile(join(directory, output + ".mjs"), code);
}
after(() => rm(directory, { recursive: true }));
const { execute } = await import(pathToFileURL(join(directory, "engine.mjs")));
const { parseTests } = await import(
  pathToFileURL(join(directory, "tests.mjs"))
);
const { parseCustomQuestions } = await import(
  pathToFileURL(join(directory, "custom.mjs"))
);
const QuickJS = await newQuickJSWASMModuleFromVariant(variant);
const bank = JSON.parse(await readFile("data/questions.json", "utf8"));
const solutions = {
  "pair-budget":
    "function solve(a,t){for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i]+a[j]===t)return[j,i];return[]}",
  "unique-window":
    "function solve(s){let best=0;for(let i=0;i<s.length;i++){let seen=new Set;for(let j=i;j<s.length&&!seen.has(s[j]);j++){seen.add(s[j]);best=Math.max(best,j-i+1)}}return best}",
  "merge-bookings":
    "function solve(a){a.sort((a,b)=>a[0]-b[0]);let out=[];for(const r of a){let last=out.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else out.push(r)}return out}",
  "tree-levels":
    "function solve(r){if(!r)return[];let out=[],q=[r];while(q.length){out.push(q.map(n=>n.val));q=q.flatMap(n=>[n.left,n.right].filter(Boolean))}return out}",
  "tree-height":
    "function solve(r){return r?1+Math.max(solve(r.left),solve(r.right)):0}",
  "route-hops":
    "function solve(g,s,d){let q=[[s,0]],seen=new Set([s]);for(let i=0;i<q.length;i++){let[n,k]=q[i];if(n===d)return k;for(const v of g[n]||[])if(!seen.has(v)){seen.add(v);q.push([v,k+1])}}return -1}",
  "dependency-order":
    "function solve(tasks,p){let left=new Set(tasks),out=[];while(left.size){let ready=[...left].reverse().filter(t=>p.filter(x=>x[0]===t).every(x=>!left.has(x[1])));if(!ready.length)return[];for(const t of ready){out.push(t);left.delete(t)}}return out}",
  "step-count":
    "function solve(n){let a=1,b=1;for(let i=0;i<n;i++)[a,b]=[b,a+b];return a}",
  "coin-cost":
    "function solve(ds,t){let dp=Array(t+1).fill(Infinity);dp[0]=0;for(let i=1;i<=t;i++)for(const d of ds)if(d<=i)dp[i]=Math.min(dp[i],1+dp[i-d]);return dp[t]===Infinity?-1:dp[t]}",
};
for (const [id, code] of Object.entries(solutions))
  test(`executes ${id} against every built-in test (including alternative valid answers)`, () => {
    const result = execute(QuickJS, {
      code,
      questionId: id,
      tests: bank.find((q) => q.id === id).testCases,
    });
    assert.equal(result.error, undefined);
    assert(result.cases.length > 0);
    assert(
      result.cases.every((t) => t.passed),
      JSON.stringify(result),
    );
  });
const one = [{ name: "Test", args: [], expected: 1 }];
test("reports wrong answers and runtime errors without crashing the runner", () => {
  assert.equal(
    execute(QuickJS, {
      code: "function solve(){return 2}",
      questionId: "custom",
      tests: one,
    }).cases[0].passed,
    false,
  );
  assert.match(
    execute(QuickJS, {
      code: 'function solve(){throw new Error("broken")}',
      questionId: "custom",
      tests: one,
    }).cases[0].error,
    /broken/,
  );
  assert(
    execute(QuickJS, {
      code: "function solve( {",
      questionId: "custom",
      tests: one,
    }).error,
  );
});
test("captures console output and does not expose browser, network, or server globals", () => {
  const result = execute(QuickJS, {
    code: 'function solve(){console.log("hello",42); return [typeof fetch,typeof window,typeof document,typeof process,typeof require]}',
    questionId: "custom",
    tests: [
      { name: "Isolation", args: [], expected: Array(5).fill("undefined") },
    ],
  });
  assert(result.cases[0].passed);
  assert.equal(result.logs[0], "hello 42");
});
test("interrupts an infinite loop and allows a fresh run afterward", () => {
  const result = execute(QuickJS, {
    code: "function solve(){while(true){}}",
    questionId: "custom",
    tests: one,
  });
  assert(result.error || result.cases[0]?.error);
  assert(result.durationMs < 4000);
  assert(
    execute(QuickJS, {
      code: "function solve(){return 1}",
      questionId: "custom",
      tests: one,
    }).cases[0].passed,
  );
});
test("validates custom tests and parses one or many custom questions", () => {
  assert.equal(parseTests(JSON.stringify(one)).length, 1);
  assert.throws(() => parseTests('[{"name":"bad","args":[]}]'));
  assert.throws(() => parseTests("[]"));
  assert.equal(parseCustomQuestions("Question one", "a").length, 1);
  const questions = parseCustomQuestions(
    "Question one\n---\nQuestion two",
    "a",
  );
  assert.equal(questions.length, 2);
  assert.notEqual(questions[0].id, questions[1].id);
  assert.throws(() => parseCustomQuestions("", "a"));
});

test("rejects async outputs and bounds allocation and recursion", () => {
  const asyncResult = execute(QuickJS, {
    code: "async function solve(){return 1}",
    questionId: "custom",
    tests: one,
  });
  assert.match(asyncResult.cases[0].error, /synchronous/);
  for (const code of [
    "function solve(){return Array(10000000).fill(1)}",
    "function solve(){return solve()}",
  ]) {
    const result = execute(QuickJS, { code, questionId: "custom", tests: one });
    assert(result.error || result.cases[0]?.error);
  }
});
