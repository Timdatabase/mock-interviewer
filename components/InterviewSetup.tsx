"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty, InterviewMode, InterviewType } from "@/lib/interview/types";

const companies = ["Meta", "Sierra", "Generic"];

export default function InterviewSetup() {
  const router = useRouter();
  const [company, setCompany] = useState("Meta");
  const [role, setRole] = useState("Software Engineer");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [difficulty, setDifficulty] = useState<Difficulty>("mid");
  const [mode, setMode] = useState<InterviewMode>("question-bank");
  const [researchUrl, setResearchUrl] = useState("");

  function startInterview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ company, role, interviewType, difficulty, mode });
    if (researchUrl) params.set("researchUrl", researchUrl);
    router.push(`/interview?${params.toString()}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-16">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[#ef6f4e]" /><span className="text-sm font-bold tracking-[0.18em] uppercase">Signal</span></div>
        <span className="text-xs tracking-[0.14em] text-[#65706b] uppercase">Interview rehearsal / 01</span>
      </header>
      <section className="grid gap-12 py-16 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div>
          <p className="mb-5 text-xs font-bold tracking-[0.2em] text-[#ef6f4e] uppercase">Voice-first practice</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl">A sharper room to think out loud.</h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[#65706b]">Practice with a focused interviewer that follows your reasoning, presses on the edges, and keeps the conversation moving.</p>
        </div>
        <form onSubmit={startInterview} className="border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-[10px_10px_0_#dfe1d7] sm:p-8">
          <div className="mb-7 flex items-start justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65706b] uppercase">Session setup</p><h2 className="mt-2 text-2xl font-semibold">Choose your room</h2></div><span className="text-2xl text-[#ef6f4e]">↗</span></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">Company<select value={company} onChange={(event) => setCompany(event.target.value)} className="mt-2 w-full border-b border-[#b8c0b9] bg-transparent py-3 outline-none"><option value="">Other / custom</option>{companies.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-semibold">Role<input value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 w-full border-b border-[#b8c0b9] bg-transparent py-3 outline-none" required /></label>
            <label className="text-sm font-semibold">Interview type<select value={interviewType} onChange={(event) => setInterviewType(event.target.value as InterviewType)} className="mt-2 w-full border-b border-[#b8c0b9] bg-transparent py-3 outline-none"><option value="technical">Technical</option><option value="system-design">System design</option><option value="behavioral">Behavioral</option></select></label>
            <label className="text-sm font-semibold">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="mt-2 w-full border-b border-[#b8c0b9] bg-transparent py-3 outline-none"><option value="junior">Junior</option><option value="mid">Mid-level</option><option value="senior">Senior</option></select></label>
          </div>
          <fieldset className="mt-7"><legend className="text-sm font-semibold">Interview mode</legend><div className="mt-3 grid grid-cols-3 gap-2">{([["question-bank", "Question bank"], ["research", "Research"], ["hybrid", "Hybrid"]] as const).map(([value, label]) => <label key={value} className={`cursor-pointer border px-3 py-3 text-center text-xs font-semibold ${mode === value ? "border-[#18201e] bg-[#18201e] text-white" : "border-[#d8d8cf] text-[#65706b]"}`}><input type="radio" className="sr-only" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} />{label}</label>)}</div></fieldset>
          {mode !== "question-bank" && <label className="mt-5 block text-sm font-semibold">Company or job URL<input value={researchUrl} onChange={(event) => setResearchUrl(event.target.value)} placeholder="https://company.com/careers/..." className="mt-2 w-full border-b border-[#b8c0b9] bg-transparent py-3 outline-none" /></label>}
          <button type="submit" className="mt-8 flex w-full items-center justify-between bg-[#ef6f4e] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#d95d3d]"><span>Start interview</span><span>→</span></button>
        </form>
      </section>
      <footer className="flex flex-wrap gap-6 border-t border-[#d8d8cf] pt-5 text-xs text-[#65706b]"><span>Local question bank</span><span>Provider-ready voice layer</span><span>Research when you need it</span></footer>
    </main>
  );
}
