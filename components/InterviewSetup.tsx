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
import Avatar from "./Avatar";
const formats = [
  {
    value: "technical",
    label: "Coding",
    icon: "{ }",
    description:
      "Explain your approach, write a solution, and put it to the test.",
  },
  {
    value: "ai-assisted",
    label: "AI-assisted",
    icon: "✦",
    description:
      "Build a practical coding task with an AI partner. Review its code, run tests, and explain your decisions.",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    icon: "◌",
    description:
      "Make your experience a clear story, with thoughtful follow-up questions.",
  },
  {
    value: "system-design",
    label: "System design",
    icon: "⊞",
    description:
      "Work through requirements, architecture, and the tradeoffs that matter.",
  },
] as const;
export default function InterviewSetup() {
  const [type, setType] = useState<SessionConfig["interviewType"]>("technical");
  const [tags, setTags] = useState<string[]>([]);
  return (
    <main className="welcome-page">
      <header className="welcome-header">
        <Link href="/" aria-label="Signal home">
          <SignalLogo />
        </Link>
        <span className="workspace-label">
          <i /> Your interview practice space
        </span>
      </header>
      <section className="welcome-grid">
        <div className="welcome-story">
          <div className="welcome-kicker">
            <span /> A little practice goes a long way
          </div>
          <h1>
            Walk into your
            <br />
            next interview
            <br />
            <em>ready.</em>
          </h1>
          <p className="welcome-description">
            A focused interviewer. A real coding workspace. Get comfortable
            explaining your ideas and thinking on your feet.
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
          <div
            className="room-preview"
            aria-label="Illustration of the interview room"
          >
            <div className="preview-topline">
              <span>
                <i />
                <i />
                <i />
              </span>
              <span>YOUR ROOM, AT A GLANCE</span>
              <span>↗</span>
            </div>
            <div className="preview-conversation">
              <div className="preview-person">
                <Avatar state="idle" />
                <span className="preview-person-tag">
                  Sam <i>Interviewer</i>
                </span>
              </div>
              <div className="preview-dialogue">
                <span className="preview-overline">
                  A CONVERSATION THAT FOLLOWS YOUR THINKING
                </span>
                <p>
                  “Walk me through
                  <br />
                  your approach.”
                </p>
                <div className="preview-wave" aria-hidden="true">
                  {[
                    8, 14, 23, 15, 30, 20, 11, 24, 35, 18, 27, 12, 19, 9, 16, 7,
                  ].map((height, index) => (
                    <i key={index} style={{ height }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="preview-code">
              <span className="preview-code-label">
                solution.py <span>Python · JavaScript · TypeScript</span>
              </span>
              <pre>
                <span className="code-line-number">1</span>{" "}
                <span className="preview-code-keyword">def</span>{" "}
                <span className="preview-code-function">solve</span>(prices,
                budget):{"\n"}
                <span className="code-line-number">2</span>{" "}
                <span className="preview-code-comment">
                  # Start with your approach.
                </span>
                {"\n"}
                <span className="code-line-number">3</span>{" "}
                <span className="preview-code-keyword">pass</span>
                <span className="preview-cursor" />
              </pre>
              <div className="preview-code-footer">
                <span>Think it through. Try it out.</span>
                <span>▶ Run tests</span>
              </div>
            </div>
          </div>
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
            <span className="eyebrow">LET’S GET YOU READY</span>
            <span className="session-chip">
              <i /> New session
            </span>
          </div>
          <h2>Make this session yours.</h2>
          <p className="form-intro">A few details, then you’re in the room.</p>
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
                  }}
                >
                  <span className="format-icon" aria-hidden="true">
                    {format.icon}
                  </span>
                  {format.label}
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
              <select name="difficulty" defaultValue="mid">
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
              </select>
            </label>
            <label>
              Time to practice
              <select
                name="duration"
                key={type}
                defaultValue={type === "ai-assisted" ? "45" : "30"}
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
                <input name="company" defaultValue="Generic" maxLength={80} />
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
          <button type="submit" className="primary wide enter-room">
            <span>Enter the interview room</span>
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
