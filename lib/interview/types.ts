import type { z } from "zod";
import type { interviewQuestionSchema } from "@/lib/schemas/question";

export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type InterviewMode = "question-bank" | "research" | "hybrid";
export type InterviewType = "technical" | "behavioral" | "system-design";
export type Difficulty = "junior" | "mid" | "senior";

export interface InterviewConfig {
  company: string;
  role: string;
  interviewType: InterviewType;
  difficulty: Difficulty;
  mode: InterviewMode;
  researchUrl?: string;
}
