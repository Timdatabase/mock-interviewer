"use client";
import { useEffect, useRef, useState } from "react";
import type { PublicQuestion } from "@/lib/interview/questions";
import type { CodeLanguage } from "@/lib/runner/languages";
import {
  assistantReplySchema,
  type AssistantReply,
  type AssistantEvent,
} from "@/lib/assistant/schema";
import { assistantEventId, createAssistantEvent } from "@/lib/assistant/events";
import { canApplyProposal, partnerHistory } from "@/lib/assistant/proposals";
interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  reply?: AssistantReply;
  baseCode?: string;
  language: CodeLanguage;
}
const actions = [
  [
    "Plan",
    "Break down this task into a concrete implementation plan and identify ambiguities. Do not write code yet.",
  ],
  [
    "Implement",
    "Implement the task in the selected language. Propose a complete solution and explain what I should verify.",
  ],
  [
    "Debug",
    "Inspect my current code and latest test results. Find the likely cause of failures and propose a corrected solution.",
  ],
  [
    "Review",
    "Review my current solution for bugs, edge cases, and tradeoffs. Explain what I should inspect and test next.",
  ],
] as const;
export default function CodingPartner({
  question,
  code,
  language,
  notes,
  latestRun,
  onApply,
  onEvent,
}: {
  question: PublicQuestion;
  code: string;
  language: CodeLanguage;
  notes: string;
  latestRun: string;
  onApply: (code: string) => void;
  onEvent: (event: AssistantEvent) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean>();
  const [model, setModel] = useState("");
  const [undo, setUndo] = useState<{
    before: string;
    after: string;
    language: CodeLanguage;
  }>();
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const chat = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    fetch("/api/assistant", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (mounted.current) {
          setConfigured(data.configured);
          setModel(data.model ?? "");
        }
      })
      .catch(() => {});
    return () => {
      mounted.current = false;
      controller.abort();
      request.current?.abort();
    };
  }, []);
  useEffect(() => {
    chat.current?.scrollTo({
      top: chat.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, pending]);
  function record(
    kind: AssistantEvent["kind"],
    text: string,
    newCode?: string,
  ) {
    onEvent(
      createAssistantEvent({
        questionId: question.id,
        language,
        kind,
        text,
        code: newCode,
      }),
    );
  }
  async function checkSetup() {
    try {
      const response = await fetch("/api/assistant");
      const data = await response.json();
      setConfigured(data.configured);
      setModel(data.model ?? "");
      setError(
        data.configured
          ? ""
          : "Add OPENAI_API_KEY to .env.local and restart the server.",
      );
    } catch {
      setError("Could not check the coding partner configuration.");
    }
  }
  async function ask(text: string) {
    if (request.current || !text.trim()) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    const baseCode = code;
    const id = assistantEventId();
    const user: Message = {
      id: `user-${id}`,
      role: "user",
      text: text.trim(),
      language,
    };
    setMessages((previous) => [...previous, user]);
    setPrompt("");
    record("prompt", user.text);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: "ai-assisted",
          task: {
            id: question.id,
            title: question.title,
            question: question.question,
          },
          language,
          code,
          notes,
          latestRun,
          prompt: user.text,
          history: partnerHistory(
            messages.map((message) => ({
              role: message.role,
              text: message.reply
                ? `${message.text}\nAssumptions: ${message.reply.assumptions.join("; ")}\nProposed code: ${message.reply.proposedCode ?? "none"}\nSuggested checks: ${message.reply.checks.join("; ")}`
                : message.text,
            })),
          ),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "The coding partner could not respond.");
      const reply = assistantReplySchema.parse(data.reply);
      if (!mounted.current || controller.signal.aborted) return;
      setModel(data.model);
      setConfigured(true);
      setMessages((previous) => [
        ...previous,
        {
          id,
          role: "assistant",
          text: reply.message,
          reply,
          baseCode,
          language,
        },
      ]);
      record("reply", reply.message, reply.proposedCode ?? undefined);
    } catch (failure) {
      if (mounted.current)
        setError(
          controller.signal.aborted
            ? "Request stopped."
            : failure instanceof Error
              ? failure.message
              : "The coding partner request failed.",
        );
    } finally {
      request.current = null;
      if (mounted.current) setPending(false);
    }
  }
  function handleApplyProposal(message: Message) {
    const proposal = {
      baseCode: message.baseCode ?? "",
      code: message.reply?.proposedCode ?? "",
      language: message.language,
    };
    if (!canApplyProposal(proposal, code, language)) {
      setError(
        "Your editor or language changed since this suggestion. Ask for a fresh proposal before applying it.",
      );
      return;
    }
    setUndo({ before: code, after: proposal.code, language });
    onApply(proposal.code);
    record(
      "applied",
      "Reviewed and applied a coding partner proposal.",
      proposal.code,
    );
  }
  return (
    <section className="assistant-panel card">
      <header className="partner-heading">
        <span className="partner-mark" aria-hidden="true">
          ✦
        </span>
        <div>
          <h2>
            Patch <span>Coding partner</span>
          </h2>
          <p>OpenAI · {model || "server configured model"}</p>
        </div>
        <span className="partner-status">
          {pending
            ? "Thinking…"
            : configured === false
              ? "Setup needed"
              : "Full assistance"}
        </span>
      </header>
      <p className="partner-roles">
        Sam leads the interview. Patch helps you plan, write, and debug. You
        review and test the result.
      </p>
      {configured === false && (
        <div className="partner-setup">
          <p>
            Set <code>OPENAI_API_KEY</code> in <code>.env.local</code> and
            restart the server to enable the coding partner. Keep the key out of
            chat.
          </p>
          <button className="secondary" onClick={checkSetup}>
            Check setup ↻
          </button>
        </div>
      )}
      <div className="partner-actions">
        {actions.map(([label, text]) => (
          <button
            key={label}
            disabled={pending || configured === false}
            onClick={() => ask(text)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="partner-messages" ref={chat} aria-live="polite">
        {!messages.length && (
          <div className="partner-empty">
            <span>✦</span>
            <h3>Delegate a useful next step.</h3>
            <p>
              Ask for a plan, an implementation, help with a failing test, or a
              review. Full code suggestions are allowed in this round.
            </p>
            <p>
              Start by explaining the requirements you want the partner to
              preserve.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <article
            className={`partner-message ${message.role}`}
            key={message.id}
          >
            <small>
              {message.role === "user" ? "YOU" : "PATCH · AI CODING PARTNER"}
            </small>
            <p>{message.text}</p>
            {message.reply && (
              <>
                {!!message.reply.assumptions.length && (
                  <div className="partner-checklist">
                    <strong>Assumptions to check</strong>
                    <ul>
                      {message.reply.assumptions.map((value, index) => (
                        <li key={index}>{value}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {message.reply.proposedCode !== null && (
                  <details className="partner-proposal" open>
                    <summary>
                      Review proposed replacement{" "}
                      <span>{message.language}</span>
                    </summary>
                    <div className="proposal-columns">
                      <div>
                        <strong>Editor at request time</strong>
                        <pre>{message.baseCode || "(empty)"}</pre>
                      </div>
                      <div>
                        <strong>Proposed solution</strong>
                        <pre>{message.reply.proposedCode}</pre>
                      </div>
                    </div>
                    <button
                      className="primary"
                      disabled={
                        pending ||
                        !canApplyProposal(
                          {
                            baseCode: message.baseCode ?? "",
                            code: message.reply.proposedCode,
                            language: message.language,
                          },
                          code,
                          language,
                        )
                      }
                      onClick={() => handleApplyProposal(message)}
                    >
                      {code === message.reply.proposedCode &&
                      language === message.language
                        ? "Already in editor"
                        : "Apply to editor"}
                    </button>
                    {(code !== message.baseCode ||
                      language !== message.language) &&
                      code !== message.reply.proposedCode && (
                        <p className="proposal-stale">
                          Editor or language changed. Request a fresh suggestion
                          to preserve your edits.
                        </p>
                      )}
                  </details>
                )}
                {!!message.reply.checks.length && (
                  <div className="partner-checklist">
                    <strong>Suggested verification · not executed</strong>
                    <ul>
                      {message.reply.checks.map((value, index) => (
                        <li key={index}>{value}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </article>
        ))}
        {pending && (
          <p className="partner-thinking">
            Patch is reviewing the current task, code, and test results…
          </p>
        )}
      </div>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {undo && (
        <div className="partner-undo">
          <span>AI code applied. Run it and inspect the result.</span>
          <button
            className="secondary"
            disabled={
              code !== undo.after || language !== undo.language || pending
            }
            onClick={() => {
              if (code === undo.after && language === undo.language) {
                onApply(undo.before);
                record(
                  "undone",
                  "Undid the applied coding partner proposal.",
                  undo.before,
                );
                setUndo(undefined);
              }
            }}
          >
            Undo apply
          </button>
        </div>
      )}
      <form
        className="partner-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(prompt);
        }}
      >
        <label htmlFor="partner-prompt">Ask your coding partner</label>
        <textarea
          id="partner-prompt"
          value={prompt}
          maxLength={6000}
          rows={3}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Implement the parser, but preserve input order and explain how you handle malformed records."
        />
        <div>
          <span>
            {language} · current task, code, notes & test results shared
          </span>
          {pending ? (
            <button
              type="button"
              className="secondary"
              onClick={() => request.current?.abort()}
            >
              Stop request
            </button>
          ) : (
            <button
              className="primary"
              disabled={!prompt.trim() || configured === false}
            >
              Ask Patch ↗
            </button>
          )}
        </div>
      </form>
      <p className="partner-disclosure">
        Requests go to OpenAI. Suggestions can be wrong; they are applied only
        when you choose. No terminal or automatic code execution is available to
        the partner.
      </p>
    </section>
  );
}
