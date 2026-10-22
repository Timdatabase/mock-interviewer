import type { RunRequest, RunResult } from "./types";
export function startRun(request: RunRequest): {
  result: Promise<RunResult>;
  stop: () => void;
} {
  const worker = new Worker(new URL("./runner.worker.ts", import.meta.url));
  let finish: (result: RunResult) => void;
  let timer: ReturnType<typeof setTimeout>;
  const result = new Promise<RunResult>((resolve) => {
    finish = (data) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(data);
    };
    timer = setTimeout(
      () =>
        finish({
          cases: [],
          logs: [],
          durationMs: 0,
          error: "Runner timed out. Try again or simplify the solution.",
        }),
      12000,
    );
    worker.onmessage = (event) => finish(event.data);
    worker.onerror = () =>
      finish({
        cases: [],
        logs: [],
        durationMs: 0,
        error: "The runner could not load. Refresh the page and try again.",
      });
    worker.postMessage(request);
  });
  return {
    result,
    stop: () =>
      finish({ cases: [], logs: [], durationMs: 0, error: "Run stopped." }),
  };
}
