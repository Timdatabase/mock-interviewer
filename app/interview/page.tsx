import Interviewer from "@/components/Interviewer";
import type { Difficulty, InterviewConfig, InterviewMode, InterviewType } from "@/lib/interview/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function InterviewPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const value = (key: string, fallback: string) => typeof params[key] === "string" ? params[key] : fallback;
  const config: InterviewConfig = {
    company: value("company", "Generic"),
    role: value("role", "Software Engineer"),
    interviewType: value("interviewType", "technical") as InterviewType,
    difficulty: value("difficulty", "mid") as Difficulty,
    mode: value("mode", "question-bank") as InterviewMode,
    researchUrl: value("researchUrl", "") || undefined,
  };
  return <Interviewer config={config} />;
}
