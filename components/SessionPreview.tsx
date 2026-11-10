"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import { isCodingInterview, type SessionConfig } from "@/lib/interview/config";

const samples = {
  technical: {
    title: "Find a pair within budget",
    prompts: [
      "What would you clarify before writing code?",
      "How would a hash map change your approach?",
      "Which edge case would you test first, and why?",
    ],
  },
  "ai-assisted": {
    title: "Repair a paginated API",
    prompts: [
      "What should happen when the API returns an empty page?",
      "What would you delegate to your coding partner?",
      "How will you verify the change before accepting it?",
    ],
  },
  behavioral: {
    title: "A decision you owned",
    prompts: [
      "Tell me about a difficult decision you took ownership of.",
      "What did you personally do, and what alternatives did you consider?",
      "What changed as a result? What would you do differently?",
    ],
  },
  "system-design": {
    title: "Design a notification service",
    prompts: [
      "Which requirements would you clarify first?",
      "How would you handle a sudden spike in notifications?",
      "Where could this design fail, and how would you recover?",
    ],
  },
};
const snippets = {
  Python: "def solve(prices, budget):\n    # Explain your approach.\n    pass",
  JavaScript:
    "function solve(prices, budget) {\n  // Explain your approach.\n  return [];\n}",
  TypeScript:
    "function solve(prices: number[], budget: number): number[] {\n  // Explain your approach.\n  return [];\n}",
};
const pagination = {
  Python:
    "def solve(pages):\n    # Collect every page, including after gaps.\n    pass",
  JavaScript:
    "function solve(pages) {\n  // Collect every page, including after gaps.\n  return [];\n}",
  TypeScript:
    "function solve(pages: number[][]): number[] {\n  // Collect every page, including after gaps.\n  return [];\n}",
};

export default function SessionPreview({
  type,
}: {
  type: SessionConfig["interviewType"];
}) {
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<keyof typeof snippets>("Python");
  const sample = samples[type];
  return (
    <section
      className="room-preview interactive-preview"
      aria-label="Interactive interview preview"
    >
      <div className="preview-topline">
        <span>
          <i />
          <i />
          <i />
        </span>
        <span>TAKE A LOOK INSIDE</span>
        <span className="preview-live-label">Interactive preview</span>
      </div>
      <div className="preview-conversation">
        <div className="preview-person">
          <Avatar state={step === 0 ? "idle" : "listening"} />
          <span className="preview-person-tag">
            Sam <i>Interviewer</i>
          </span>
        </div>
        <div className="preview-dialogue">
          <span className="preview-overline">{sample.title}</span>
          <p key={step} aria-live="polite">
            “{sample.prompts[step]}”
          </p>
        </div>
      </div>
      <div
        className="preview-steps"
        role="group"
        aria-label="Preview interview phase"
      >
        {["Clarify", "Explore", "Reflect"].map((label, index) => (
          <button
            type="button"
            key={label}
            aria-pressed={step === index}
            onClick={() => setStep(index)}
          >
            <span>0{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <div className="preview-code">
        {isCodingInterview(type) ? (
          <>
            <div className="preview-code-label">
              <span>Your workspace</span>
              <label>
                <span className="sr-only">Preview language</span>
                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as keyof typeof snippets)
                  }
                >
                  {Object.keys(snippets).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            <pre>
              {(type === "ai-assisted" ? pagination : snippets)[language]}
            </pre>
          </>
        ) : (
          <>
            <div className="preview-code-label">Your thinking space</div>
            <pre>
              {type === "behavioral"
                ? "01  The situation\n02  Your actions & decisions\n03  The result & what you learned"
                : "01  Requirements & scale\n02  Components & data flow\n03  Tradeoffs & failure recovery"}
            </pre>
          </>
        )}
        <div className="preview-demo-footer">
          <span>Sample conversation · no microphone</span>
          <button type="button" onClick={() => setStep((step + 1) % 3)}>
            {step === 2 ? "Start again ↺" : "Next follow-up →"}
          </button>
        </div>
      </div>
    </section>
  );
}
