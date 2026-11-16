"use client";
import { useState } from "react";
import Form from "next/form";
import Link from "next/link";
import {
  topicOptions,
  isCodingInterview,
  type SessionConfig,
} from "@/lib/interview/config";
import SignalLogo from "./SignalLogo";
import SessionPreview from "./SessionPreview";
const formats = [
  {
    value: "technical",
    label: "Coding",
    icon: "⌘",
    detail: "Think. Code. Explain.",
    description:
      "Explain your approach, write a solution, and put it to the test.",
  },
  {
    value: "ai-assisted",
    label: "AI-assisted",
    icon: "✦",
    detail: "Build with an AI partner.",
    description:
      "Build a practical coding task with an AI partner. Review its code, run tests, and explain your decisions.",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    icon: "◌",
    detail: "Find your story.",
    description:
      "Make your experience a clear story, with thoughtful follow-up questions.",
  },
  {
    value: "system-design",
    label: "System design",
    icon: "⊞",
    detail: "See the bigger picture.",
    description:
      "Work through requirements, architecture, and the tradeoffs that matter.",
  },
] as const;
export default function InterviewSetup() {
  const [type, setType] = useState<SessionConfig["interviewType"]>("technical");
  const [tags, setTags] = useState<string[]>([]);
  const [duration, setDuration] = useState("30");
  const [level, setLevel] = useState("mid");
  return (
    <main className="welcome-page">
      <header className="welcome-header">
        <Link href="/" aria-label="Signal home">
          <SignalLogo />
        </Link>
        <span className="workspace-label">
          <i /> Your personal interview studio
        </span>
      </header>
      <section className="welcome-grid">
        <div className="welcome-story">
          <div className="welcome-kicker">
            <span /> YOUR NEXT CHAPTER STARTS HERE
          </div>
          <h1>
            Great interviews.<br />
            Start with a<br />
            <em>little signal.</em>
          </h1>
          <p className="welcome-description">
            A space to think out loud, find your flow, and build confidence. Real conversation. Real code. Your next step forward.
          </p>
          <div className="welcome-capabilities">
            <span>
              <i>↗</i> Live conversation
            </span>
            <span>
              <i>⌘</i> Runnable code
            </span>
            <span>
              <i>＋</i> Your questions
            </span>
          </div>
          <SessionPreview key={type} type={type} />
          <p className="welcome-bottom-note">
            <span>01</span> Choose a focus <b>→</b>
            <span>02</span> Work it through <b>→</b>
            <span>03</span> Reflect & repeat
          </p>
        </div>
        <Form action="/interview" className="card setup-form welcome-form">
          <input type="hidden" name="interviewType" value={type} />
          <input type="hidden" name="tags" value={tags.join(",")} />
          <div className="form-heading">
            <span className="eyebrow">THE PRACTICE STUDIO</span>
            <span className="session-chip">
              <i /> New session
            </span>
          </div>
          <h2>Find your focus.</h2>
          <p className="form-intro">One focused session. A little more confidence.</p>
          <div className="setup-journey" aria-label="Session setup steps">
            <span className="active"><b>01</b> Choose a focus</span><i /><span><b>02</b> Make it yours</span><i /><span><b>03</b> Step inside</span>
          </div>
          <fieldset className="format-fieldset">
            <legend>What are we practicing?</legend>
            <div className="format-options">
              {formats.map((format) => (
                <button
                  key={format.value}
                  type="button"
                  aria-pressed={type === format.value}
                  onClick={() => {
                    setType(format.value);
                    setTags([]);
                    setDuration(format.value === "ai-assisted" ? "45" : "30");
                  }}
                >
                  <span className="format-icon" aria-hidden="true">
                    {format.icon}
                  </span>
                  <span className="format-copy"><strong>{format.label}</strong><small>{format.detail}</small></span>
                  <span className="format-check" aria-hidden="true">{type === format.value ? "✓" : "↗"}</span>
                </button>
              ))}
            </div>
            <p className="format-description" aria-live="polite">
              {formats.find((format) => format.value === type)?.description}
            </p>
          </fieldset>
          <div className="fields session-fields">
            <label>
              Experience level
              <select
                name="difficulty"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              >
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
              </select>
            </label>
            <label>
              Time to practice
              <select
                name="duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </label>
            {isCodingInterview(type) && (
              <label className="full-field">
                Problem difficulty
                <select name="problemDifficulty" defaultValue="any">
                  <option value="any">Surprise me · any difficulty</option>
                  <option value="easy">Easy · build momentum</option>
                  <option value="medium">Medium · stretch your thinking</option>
                  <option value="hard">Hard · take on a challenge</option>
                </select>
              </label>
            )}
          </div>
          <details className="practice-preferences">
            <summary>
              Topics & preferences{" "}
              <span>
                {tags.length ? `${tags.length} selected` : "Optional"}
              </span>
              <i aria-hidden="true">＋</i>
            </summary>
            <div>
              <fieldset className="topic-fieldset">
                <legend>
                  Pick your topics <span>Optional</span>
                </legend>
                <div className="chips">
                  {topicOptions[type].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      aria-pressed={tags.includes(tag)}
                      className={tags.includes(tag) ? "selected" : ""}
                      onClick={() =>
                        setTags((previous) =>
                          previous.includes(tag)
                            ? previous.filter((value) => value !== tag)
                            : [...previous, tag],
                        )
                      }
                    >
                      {tags.includes(tag) && <span aria-hidden="true">✓ </span>}
                      {tag.replaceAll("-", " ")}
                    </button>
                  ))}
                </div>
                <p className="field-hint">
                  Leave these open for a random question. You can bring your own
                  questions inside.
                </p>
              </fieldset>
              <details className="setup-details">
                <summary>
                  Role & company <span>Personalize your conversation</span>
                  <i aria-hidden="true">＋</i>
                </summary>
                <div className="fields">
                  <label>
                    Target role
                    <input
                      name="role"
                      defaultValue="Software Engineer"
                      required
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Company focus
                    <input
                      name="company"
                      defaultValue="Generic"
                      maxLength={80}
                    />
                    <small>Generic uses general practice questions.</small>
                  </label>
                </div>
              </details>
              <label className="check setup-repeat">
                <input type="hidden" name="avoidRecent" value="false" />
                <input
                  type="checkbox"
                  name="avoidRecent"
                  value="true"
                  defaultChecked
                />
                <span>
                  Keep it fresh{" "}
                  <small>Prefer questions I haven’t practiced recently.</small>
                </span>
              </label>
            </div>
          </details>
          <div className="session-summary" aria-live="polite">
            <span>Your session</span>
            <strong>
              {duration} min ·{" "}
              {formats.find((format) => format.value === type)?.label} ·{" "}
              {level === "mid"
                ? "Mid-level"
                : level === "junior"
                  ? "Junior"
                  : "Senior"}
            </strong>
            <small>
              {tags.length
                ? `${tags.length} topic${tags.length === 1 ? "" : "s"} selected`
                : "All topics · a fresh question"}
            </small>
          </div>
          <button type="submit" className="primary wide enter-room">
            <span>Let’s find your flow</span>
            <span className="button-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
          <p className="form-footnote">
            <span aria-hidden="true">◌</span> Go at your own pace. Voice is
            optional.
          </p>
        </Form>
      </section>
      <footer className="welcome-footer">
        <span>Built for the thinking behind a good answer.</span>
        <span>
          Python <i>·</i> JavaScript <i>·</i> TypeScript
        </span>
      </footer>
    </main>
  );
}
