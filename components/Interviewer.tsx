"use client";

import Link from "next/link";
import { useState } from "react";
import type { InterviewConfig } from "@/lib/interview/types";
import { getQuestionsForInterview } from "@/lib/interview/questions";
import { ElevenLabsProvider, useElevenLabsProvider } from "@/lib/voice/elevenlabs";

function InterviewSession({ config }: { config: InterviewConfig }) {
  const provider = useElevenLabsProvider();
  const [startError, setStartError] = useState<string>();
  const [isStarting, setIsStarting] = useState(false);
  const questions = getQuestionsForInterview(config);

  async function start() {
    setStartError(undefined);
    setIsStarting(true);
    try {
      await provider.start();
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setStartError("Microphone access was blocked. Allow microphone access for localhost, then try again.");
      } else {
        setStartError(error instanceof Error ? error.message : "Unable to start the voice session.");
      }
    } finally {
      setIsStarting(false);
    }
  }

  const connectionLabel = isStarting ? "requesting microphone" : provider.status;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8 sm:px-10 lg:px-16">
      <header className="flex items-center justify-between border-b border-[#d8d8cf] pb-6">
        <Link href="/" className="text-sm font-bold tracking-[0.18em] uppercase">Signal</Link>
        <div className="text-right">
          <p className="text-xs tracking-[0.14em] text-[#65706b] uppercase">{config.company} / {config.role}</p>
          <p className="mt-1 text-sm font-semibold">{config.interviewType.replace("-", " ")} · {config.mode.replace("-", " ")}</p>
        </div>
      </header>

      <section className="grid gap-8 py-10 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="space-y-5">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#ef6f4e] uppercase">Live room</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Stay with the thought.</h1>
          </div>
          <div className="border border-[#d8d8cf] bg-[#fbfaf6] p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Connection</span>
              <span className="flex items-center gap-2 text-xs text-[#65706b]">
                <i className={`h-2 w-2 rounded-full ${provider.status === "connected" ? "bg-[#4b9b75]" : "bg-[#b8c0b9]"}`} />
                {connectionLabel}
              </span>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={start} disabled={isStarting || provider.status === "connected" || provider.status === "connecting"} className="flex-1 bg-[#18201e] px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
                {isStarting ? "Allow microphone..." : "Start"}
              </button>
              <button onClick={provider.end} disabled={provider.status !== "connected"} className="flex-1 border border-[#18201e] px-4 py-3 text-sm font-bold disabled:opacity-40">End</button>
            </div>
            {provider.status === "connected" && <button onClick={provider.toggleMute} className="mt-3 w-full border border-[#d8d8cf] px-4 py-3 text-sm font-semibold">{provider.isMuted ? "Unmute microphone" : "Mute microphone"}</button>}
            {(provider.error || startError) && <p className="mt-4 text-sm text-[#b34f3d]">{provider.error || startError}</p>}
          </div>
          <div className="text-sm leading-6 text-[#65706b]">{questions.length ? `${questions.length} saved question${questions.length === 1 ? "" : "s"} ready.` : "Research mode is ready for the server workflow; add a URL to discover questions."}</div>
        </aside>

        <section className="min-h-[520px] border border-[#d8d8cf] bg-[#fbfaf6] p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-[#e4e4dc] pb-5">
            <h2 className="text-sm font-bold tracking-[0.16em] uppercase">Transcript</h2>
            <span className="text-xs text-[#65706b]">{provider.isSpeaking ? "Interviewer speaking" : "Listening"}</span>
          </div>
          <div className="flex min-h-[420px] flex-col justify-end gap-5 py-6">
            {provider.transcript.length === 0 ? <div className="m-auto max-w-sm text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1ddd5] text-2xl text-[#ef6f4e]">◌</div><p className="text-lg font-semibold">Your interviewer is ready.</p><p className="mt-2 text-sm leading-6 text-[#65706b]">Start the session and give yourself a beat before answering. The transcript will appear here.</p></div> : provider.transcript.map((message) => <div key={message.id} className={`max-w-[85%] ${message.role === "user" ? "self-end text-right" : "self-start"}`}><p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-[#65706b] uppercase">{message.role === "user" ? "You" : "Interviewer"}</p><p className="text-lg leading-8">{message.text}</p></div>)}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function Interviewer({ config }: { config: InterviewConfig }) {
  return <ElevenLabsProvider><InterviewSession config={config} /></ElevenLabsProvider>;
}
