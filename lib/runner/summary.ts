import type { RunResult } from "./types";
function preview(value: unknown) {
  return (JSON.stringify(value) ?? "undefined").slice(0, 600);
}
// Keep background voice context bounded even with large custom test output.
export function summarizeRun(result: RunResult) {
  return {
    passed: result.cases.filter((test) => test.passed).length,
    totalExecuted: result.cases.length,
    durationMs: result.durationMs,
    error: result.error,
    cases: [
      ...result.cases.filter((test) => !test.passed),
      ...result.cases.filter((test) => test.passed),
    ]
      .slice(0, 5)
      .map((test) => ({
        name: test.name.slice(0, 100),
        passed: test.passed,
        args: preview(test.args),
        expected: preview(test.expected),
        actual: preview(test.actual),
        error: test.error?.slice(0, 300),
      })),
    logs: result.logs.slice(-3).map((line) => line.slice(0, 600)),
  };
}
