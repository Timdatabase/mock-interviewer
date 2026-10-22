"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { PublicQuestion } from "@/lib/interview/questions";
import { startRun } from "@/lib/runner/client";
import { parseTests } from "@/lib/runner/tests";
import type { RunResult } from "@/lib/runner/types";
const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <div className="editor-loading">Loading your editor…</div>,
});
export interface RunRecord {
  questionId: string;
  code: string;
  result: RunResult;
}
export default function CodeWorkspace({
  question,
  code,
  onChange,
  onCursor,
  onRun,
  onAsk,
  voiceConnected,
}: {
  question: PublicQuestion;
  code: string;
  onChange: (code: string) => void;
  onCursor: (line: number) => void;
  onRun: (run: RunRecord) => void;
  onAsk: (message: string) => void;
  voiceConnected: boolean;
}) {
  const [tab, setTab] = useState<"tests" | "output">("tests");
  const [tests, setTests] = useState(
    JSON.stringify(question.testCases, null, 2),
  );
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState<RunRecord>();
  const [error, setError] = useState("");
  const active = useRef<ReturnType<typeof startRun> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.stop();
    };
  }, []);
  async function executeCode() {
    if (active.current) return;
    setError("");
    try {
      const parsed = parseTests(tests);
      setRunning(true);
      setTab("output");
      const task = startRun({ code, questionId: question.id, tests: parsed });
      active.current = task;
      const result = await task.result;
      if (!mounted.current) return;
      const record = { questionId: question.id, code, result };
      setRun(record);
      onRun(record);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Unable to run code.",
      );
    } finally {
      active.current = null;
      if (mounted.current) setRunning(false);
    }
  }
  const passed = run?.result.cases.filter((test) => test.passed).length ?? 0;
  return (
    <section className="coding-panel">
      <div className="code-titlebar">
        <div className="file-tab">
          <span>JS</span> solution.js
        </div>
        <span className="runtime-label">JavaScript · isolated runtime</span>
      </div>
      <CodeEditor code={code} onChange={onChange} onCursor={onCursor} />
      <div className="execution-toolbar">
        <span>
          Implement <code>solve(...)</code> · 2s limit · no network access
        </span>
        <div>
          {running ? (
            <button
              className="stop-button"
              onClick={() => active.current?.stop()}
            >
              ■ Stop
            </button>
          ) : (
            <button className="run-button" onClick={executeCode}>
              ▶ Run tests <kbd> </kbd>
            </button>
          )}
          <button
            className="discuss-button"
            disabled={!voiceConnected || running}
            onClick={() =>
              onAsk(
                "Review my current solution and the latest test run. Ask me one useful follow-up about a bug, edge case, or complexity. Do not give me the solution.",
              )
            }
          >
            Discuss with Sam ↗
          </button>
        </div>
      </div>
      <div className="output-panel">
        <div className="output-tabs">
          <button
            aria-pressed={tab === "tests"}
            onClick={() => setTab("tests")}
          >
            Test cases <span>{question.testCases.length || "Custom"}</span>
          </button>
          <button
            aria-pressed={tab === "output"}
            onClick={() => setTab("output")}
          >
            Output{" "}
            {run && (
              <span
                className={
                  passed === run.result.cases.length && !run.result.error
                    ? "success-text"
                    : "failure-text"
                }
              >
                {passed}/{run.result.cases.length}
              </span>
            )}
          </button>
          <span className="output-help">
            Visible tests only · not a complete correctness proof
          </span>
        </div>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        {tab === "tests" ? (
          <div className="test-editor">
            <label htmlFor="test-input">Edit or add tests · JSON array</label>
            <textarea
              id="test-input"
              spellCheck={false}
              value={tests}
              onChange={(event) => setTests(event.target.value)}
              rows={8}
              maxLength={50000}
            />
            <p>
              Each case:{" "}
              <code>{'{"name":"Example","args":[4],"expected":5}'}</code>.
              Values in <code>args</code> become separate arguments to{" "}
              <code>solve</code>.
            </p>
          </div>
        ) : (
          <div className="run-output" role="status" aria-live="polite">
            {running ? (
              <div className="run-empty">
                <span className="running-dot" /> Running your code in a fresh
                sandbox…
              </div>
            ) : run ? (
              <>
                {run.code !== code && (
                  <p className="stale-run">
                    Code has changed since this run. Run again for current
                    results.
                  </p>
                )}
                <div className="run-summary">
                  <strong
                    className={
                      passed === run.result.cases.length && !run.result.error
                        ? "success-text"
                        : "failure-text"
                    }
                  >
                    {run.result.error
                      ? "Run incomplete"
                      : `${passed} of ${run.result.cases.length} tests passed`}
                  </strong>
                  <span>{run.result.durationMs} ms</span>
                </div>
                {run.result.error && (
                  <pre className="failure-text">{run.result.error}</pre>
                )}
                {run.result.cases.map((test, index) => (
                  <details
                    className="test-result"
                    key={index}
                    open={!test.passed}
                  >
                    <summary>
                      <span
                        className={
                          test.passed ? "success-text" : "failure-text"
                        }
                      >
                        {test.passed ? "✓" : "×"}
                      </span>{" "}
                      {test.name}
                      <span>{test.passed ? "Passed" : "Failed"}</span>
                    </summary>
                    <div className="test-values">
                      <div>
                        <small>INPUT ARGUMENTS</small>
                        <pre>{JSON.stringify(test.args)}</pre>
                      </div>
                      <div>
                        <small>EXPECTED</small>
                        <pre>{JSON.stringify(test.expected)}</pre>
                      </div>
                      <div>
                        <small>ACTUAL</small>
                        <pre>
                          {test.error ||
                            JSON.stringify(test.actual) ||
                            "undefined"}
                        </pre>
                      </div>
                    </div>
                  </details>
                ))}
                {run.result.logs.length > 0 && (
                  <div className="console-output">
                    <small>CONSOLE</small>
                    <pre>{run.result.logs.join("\n")}</pre>
                  </div>
                )}
              </>
            ) : (
              <div className="run-empty">
                Run your code to see test results, errors, and console output.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
