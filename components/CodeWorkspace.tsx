"use client";
import dynamic from "next/dynamic";
import PaneDivider from "./PaneDivider";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { PublicQuestion } from "@/lib/interview/questions";
import { startRun } from "@/lib/runner/client";
import { parseTests } from "@/lib/runner/tests";
import { languages, type CodeLanguage } from "@/lib/runner/languages";
import type { RunResult } from "@/lib/runner/types";
const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <div className="editor-loading">Loading your editor…</div>,
});
export interface RunRecord {
  questionId: string;
  language: CodeLanguage;
  code: string;
  result: RunResult;
}
export default function CodeWorkspace({
  question,
  language,
  onLanguageChange,
  code,
  onChange,
  onCursor,
  onRun,
  onAsk,
  voiceConnected,
  compactTests = false,
}: {
  question: PublicQuestion;
  language: CodeLanguage;
  onLanguageChange: (language: CodeLanguage) => void;
  code: string;
  onChange: (code: string) => void;
  onCursor: (line: number) => void;
  onRun: (run: RunRecord) => void;
  onAsk: (message: string) => void;
  voiceConnected: boolean;
  compactTests?: boolean;
}) {
  const [consoleOpen, setConsoleOpen] = useState(!compactTests);
  const [tab, setTab] = useState<"tests" | "output" | "errors">("tests");
  const [consoleSize, setConsoleSize] = useState(28);
  const panelElement = useRef<HTMLElement>(null);
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
    setConsoleOpen(true);
    try {
      const parsed = parseTests(tests);
      setRunning(true);
      setTab("output");
      const task = startRun({
        code,
        language,
        questionId: question.id,
        tests: parsed,
      });
      active.current = task;
      const result = await task.result;
      if (!mounted.current) return;
      const record = { questionId: question.id, language, code, result };
      setRun(record);
      if (result.error) setTab("errors");
      onRun(record);
    } catch (failure) {
      setTab("errors");
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
    <section
      className={`coding-panel ${consoleOpen ? "" : "console-collapsed"}`}
      ref={panelElement}
      style={{ "--console-size": `${consoleSize}%` } as CSSProperties}
    >
      <div className="code-titlebar">
        <div className="file-tab">
          <span>
            {language === "python"
              ? "PY"
              : language === "typescript"
                ? "TS"
                : "JS"}
          </span>{" "}
          {languages.find((item) => item.id === language)?.file}
        </div>
        <label className="language-select">
          <span className="sr-only">Programming language</span>
          <select
            value={language}
            disabled={running}
            onChange={(event) =>
              onLanguageChange(event.target.value as CodeLanguage)
            }
          >
            {languages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="editor-actions">
          {running ? (
            <button
              className="stop-button"
              onClick={() => active.current?.stop()}
            >
              ■ Stop
            </button>
          ) : (
            <button className="run-button" onClick={executeCode}>
              ▶ Run tests
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
      <CodeEditor
        language={language}
        code={code}
        onChange={onChange}
        onCursor={onCursor}
      />
      {consoleOpen && (
        <PaneDivider
          orientation="horizontal"
          label="Resize tests and output"
          value={consoleSize}
          min={15}
          max={45}
          onDrag={(_, y) => {
            const bounds = panelElement.current?.getBoundingClientRect();
            if (bounds)
              setConsoleSize(
                Math.max(
                  15,
                  Math.min(45, ((bounds.bottom - y) / bounds.height) * 100),
                ),
              );
          }}
          onStep={(direction) =>
            setConsoleSize((size) =>
              Math.max(15, Math.min(45, size - direction * 3)),
            )
          }
        />
      )}
      <div className="output-panel">
        <div className="output-tabs">
          <button
            aria-pressed={tab === "tests"}
            onClick={() => {
              setTab("tests");
              setConsoleOpen(true);
            }}
          >
            Test cases <span>{question.testCases.length || "Custom"}</span>
          </button>
          <button
            aria-pressed={tab === "output"}
            onClick={() => {
              setTab("output");
              setConsoleOpen(true);
            }}
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
          <button
            aria-pressed={tab === "errors"}
            onClick={() => {
              setTab("errors");
              setConsoleOpen(true);
            }}
          >
            Errors{" "}
            <span>
              {(error ? 1 : 0) +
                (run?.result.error ? 1 : 0) +
                (run?.result.cases.filter((test) => test.error).length ?? 0)}
            </span>
          </button>
          <button
            type="button"
            className="console-toggle"
            aria-label={
              consoleOpen
                ? "Collapse tests and output"
                : "Expand tests and output"
            }
            aria-expanded={consoleOpen}
            onClick={() => setConsoleOpen(!consoleOpen)}
          >
            {consoleOpen ? "⌄ Hide" : "⌃ Show"}
          </button>
          <span className="output-help">
            Visible tests only · not a complete correctness proof
          </span>
        </div>
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
        ) : tab === "errors" ? (
          <div
            className="run-output error-output"
            role="status"
            aria-live="polite"
          >
            {error && <pre className="failure-text">{error}</pre>}
            {run?.result.error && (
              <pre className="failure-text">{run.result.error}</pre>
            )}
            {run?.result.cases
              .filter((test) => test.error)
              .map((test, index) => (
                <div key={index}>
                  <h3>{test.name}</h3>
                  <pre className="failure-text">{test.error}</pre>
                </div>
              ))}
            {!error &&
              !run?.result.error &&
              !run?.result.cases.some((test) => test.error) && (
                <p className="run-empty">
                  No runtime errors
                  {run
                    ? " in the latest run."
                    : " yet. Run your code to check."}
                </p>
              )}
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
                {(run.code !== code || run.language !== language) && (
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
