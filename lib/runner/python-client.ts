import { pythonProgram } from "./python-program";
import { matchesOutput } from "./validate";
import type { RunRequest, RunResult } from "./types";

// Python can import browser bindings. Keep it out of the application's origin:
// a sandboxed frame owns the worker, with CSP allowing only public runtime assets.
export function startPythonRun(request: RunRequest): {
  result: Promise<RunResult>;
  stop: () => void;
} {
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("title", "Isolated Python runner");
  const assetURL = `${location.origin}/_python/`;
  const workerSource = `
self.onmessage = async event => {
  try {
    importScripts(${JSON.stringify(assetURL + "pyodide.js")});
    const python = await loadPyodide({ indexURL: ${JSON.stringify(assetURL)} });
    self.postMessage({ kind: "ready" });
    const start = performance.now();
    const output = JSON.parse(python.runPython(event.data.program));
    self.postMessage({ kind: "result", ...output, durationMs: Math.round(performance.now() - start) });
  } catch (error) { self.postMessage({ kind: "result", cases: [], logs: [], durationMs: 0, error: String(error.message || error).slice(0, 2000) }); }
};`;
  const policy = `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: ${assetURL}; connect-src ${assetURL}; worker-src blob:;`;
  const bridge = `
const workerURL = URL.createObjectURL(new Blob([${JSON.stringify(workerSource)}], {type:"text/javascript"}));
const worker = new Worker(workerURL);
window.onmessage = event => {
  if (event.source !== parent || !event.ports[0]) return;
  const port = event.ports[0];
  port.onmessage = message => {
    if (message.data.stop) { worker.terminate(); URL.revokeObjectURL(workerURL); }
    else worker.postMessage(message.data);
  };
  worker.onmessage = message => port.postMessage(message.data);
  worker.onerror = () => port.postMessage({kind:"result",cases:[],logs:[],durationMs:0,error:"Python could not load. Restart the dev server to prepare the runtime assets."});
  port.start();
};`;
  frame.srcdoc = `<meta http-equiv="Content-Security-Policy" content="${policy}"><script>${bridge}</script>`;
  const channel = new MessageChannel();
  let settle: (result: RunResult) => void;
  let timer: ReturnType<typeof setTimeout>;
  let done = false;
  let ready = false;
  const result = new Promise<RunResult>((resolve) => {
    settle = (output) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      channel.port1.postMessage({ stop: true });
      channel.port1.close();
      channel.port2.close();
      frame.onload = null;
      frame.remove();
      resolve(output);
    };
    timer = setTimeout(
      () =>
        settle({
          cases: [],
          logs: [],
          durationMs: 0,
          error: "Python runtime startup timed out. Refresh and try again.",
        }),
      45000,
    );
    channel.port1.onmessage = (event) => {
      const data = event.data;
      if (data.kind === "ready" && !ready) {
        ready = true;
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            settle({
              cases: [],
              logs: [],
              durationMs: 2500,
              error: "Python exceeded the 2.5-second execution limit.",
            }),
          2500,
        );
      } else if (data.kind === "result") {
        const cases = (data.cases ?? [])
          .slice(0, request.tests.length)
          .map((item: { actual?: unknown; error?: string }, index: number) => ({
            ...request.tests[index],
            ...item,
            passed:
              !item.error &&
              matchesOutput(
                request.questionId,
                request.tests[index].args,
                item.actual,
                request.tests[index].expected,
              ),
          }));
        settle({
          cases,
          logs: data.logs ?? [],
          durationMs: data.durationMs ?? 0,
          error: data.error,
        });
      }
    };
    frame.onload = () => {
      frame.contentWindow?.postMessage({ init: true }, "*", [channel.port2]);
      channel.port1.postMessage({ program: pythonProgram(request) });
    };
    document.body.appendChild(frame);
  });
  return {
    result,
    stop: () =>
      settle({ cases: [], logs: [], durationMs: 0, error: "Run stopped." }),
  };
}
