import "server-only";

import { z } from "zod";

export const researchedQuestionSchema = z.object({
  question: z.string(),
  interviewType: z.enum(["technical", "behavioral", "system-design"]),
  topics: z.array(z.string()),
  sourceUrl: z.string().url(),
  confidence: z.enum(["low", "medium", "high"]),
});

export const researchResultSchema = z.object({ company: z.string(), questions: z.array(researchedQuestionSchema) });
export type ResearchResult = z.infer<typeof researchResultSchema>;

export async function researchCompanyQuestions(company: string, sourceUrl?: string): Promise<ResearchResult> {
  void sourceUrl;
  void process.env.BROWSERBASE_API_KEY;
  void process.env.BROWSERBASE_PROJECT_ID;
  return { company, questions: [] };
}
