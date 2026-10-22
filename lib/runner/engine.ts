import type { QuickJSWASMModule, QuickJSHandle } from "quickjs-emscripten-core";
import type { CaseResult, RunRequest, RunResult } from "./types";
import { matchesOutput } from "./validate";

export function execute(
  QuickJS: QuickJSWASMModule,
  request: RunRequest,
): RunResult {
  const start = Date.now();
  const logs: string[] = [];
  const cases: CaseResult[] = [];
  if (request.code.length > 24000 || request.tests.length > 30)
    return {
      cases,
      logs,
      durationMs: 0,
      error: "Use at most 24,000 code characters and 30 tests.",
    };
  const runtime = QuickJS.newRuntime();
  runtime.setMemoryLimit(16 * 1024 * 1024);
  runtime.setMaxStackSize(64 * 1024);
  runtime.setInterruptHandler(() => Date.now() - start > 2000);
  const vm = runtime.newContext();
  let error: string | undefined;
  function readFailure(handle: QuickJSHandle): string {
    // Leave a small diagnostic reserve after guest heap exhaustion. Reading only
    // the message avoids serializing an arbitrarily large thrown object.
    runtime.setMemoryLimit(18 * 1024 * 1024);
    try {
      if (Date.now() - start > 2000) return "Time limit exceeded (2 seconds).";
      const message = vm.getProp(handle, "message");
      try {
        return vm.typeof(message) === "string"
          ? vm.getString(message).slice(0, 2000)
          : vm.getString(handle).slice(0, 2000);
      } finally {
        message.dispose();
      }
    } finally {
      handle.dispose();
      runtime.setMemoryLimit(16 * 1024 * 1024);
    }
  }
  try {
    const consoleObject = vm.newObject();
    const log = vm.newFunction("log", (...values) => {
      if (logs.length >= 50) return;
      const line = values
        .map((value) => {
          const data = vm.dump(value);
          return typeof data === "string" ? data : JSON.stringify(data);
        })
        .join(" ")
        .slice(0, 1000);
      logs.push(line);
    });
    for (const method of ["log", "warn", "error", "info"])
      vm.setProp(consoleObject, method, log);
    vm.setProp(vm.global, "console", consoleObject);
    log.dispose();
    consoleObject.dispose();
    const compiled = vm.evalCode(
      `(function () { "use strict";\n${request.code}\n; if (typeof solve !== "function") throw new Error("Define function solve(...) to run your tests."); return solve; })()`,
      "solution.js",
    );
    if (compiled.error) {
      throw new Error(readFailure(compiled.error));
    }
    const solve = compiled.value;
    try {
      for (const test of request.tests) {
        const input = vm.evalCode(JSON.stringify(test.args));
        if (input.error) {
          input.error.dispose();
          throw new Error("Invalid test arguments.");
        }
        const args = test.args.map((_, index) =>
          vm.getProp(input.value, index),
        );
        input.value.dispose();
        try {
          const result = vm.callFunction(solve, vm.undefined, ...args);
          if (result.error) {
            const failure = readFailure(result.error);
            cases.push({
              ...test,
              passed: false,
              error: failure,
            });
          } else {
            try {
              const state = vm.getPromiseState(result.value);
              if (!(state.type === "fulfilled" && state.notAPromise)) {
                if (state.type === "fulfilled") state.value.dispose();
                if (state.type === "rejected") state.error.dispose();
                cases.push({
                  ...test,
                  passed: false,
                  error:
                    "Return a synchronous value from solve; async functions are not supported yet.",
                });
                continue;
              }
              const actual = vm.dump(result.value);
              const serialized = JSON.stringify(actual);
              if (serialized && serialized.length > 20000)
                throw new Error("Output exceeds 20,000 characters.");
              cases.push({
                ...test,
                actual,
                passed: matchesOutput(
                  request.questionId,
                  test.args,
                  actual,
                  test.expected,
                ),
              });
            } finally {
              result.value.dispose();
            }
          }
        } finally {
          args.forEach((arg) => arg.dispose());
        }
        if (Date.now() - start > 2000) {
          error = "Time limit exceeded (2 seconds).";
          break;
        }
      }
    } finally {
      solve.dispose();
    }
  } catch (failure) {
    error = failure instanceof Error ? failure.message : "Execution failed.";
  } finally {
    vm.dispose();
    runtime.dispose();
  }
  return { cases, logs, error, durationMs: Date.now() - start };
}
