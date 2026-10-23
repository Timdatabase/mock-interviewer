"use client";
import { MAX_BANK_CHARACTERS } from "@/lib/interview/limits";
import { useState } from "react";
export default function CustomQuestionBank({
  count,
  active,
  onLoad,
  onCurated,
}: {
  count: number;
  active: boolean;
  onLoad: (text: string) => void;
  onCurated: () => void;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <section className="custom-bank">
      <div className="bank-header">
        <div>
          <span className="eyebrow">QUESTION SOURCE</span>
          <strong>
            {active
              ? `My questions · ${count} in this bank`
              : "Curated practice bank"}
          </strong>
        </div>
        <div>
          {active && (
            <button className="secondary" onClick={onCurated}>
              Use curated bank
            </button>
          )}
          <button
            className="secondary"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "Close" : "＋ Bring your own questions"}
          </button>
        </div>
      </div>
      {open && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onLoad(text);
          }}
        >
          <label htmlFor="custom-questions">
            Paste one question, or a batch separated by a line containing ---
          </label>
          <textarea
            id="custom-questions"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={7}
            maxLength={MAX_BANK_CHARACTERS}
            required
            placeholder={
              "Implement a least recently used cache.\n---\nGiven a sorted array, find the first and last index of a target.\n---\nTell me about a time you changed your mind after receiving feedback."
            }
          />
          <div className="bank-footer">
            <span>
              {text.length.toLocaleString()} / 500,000 characters · up to 30
              questions, 50,000 characters each. Uses the interview type
              selected in setup. New bank replaces the active pool.
            </span>
            <button className="primary" type="submit">
              Use my questions & pick one ↗
            </button>
          </div>
          <p className="fine">
            Question drafts stay in this session. Connecting voice shares the
            active question and workspace with ElevenLabs.
          </p>
        </form>
      )}
    </section>
  );
}
