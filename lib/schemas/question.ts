import { z } from "zod";

export const sourceTypeSchema = z.enum(["asked_me", "asked_friend", "reported_online", "ai_generated"]);

export const interviewQuestionSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  role: z.string().min(1),
  interviewType: z.enum(["technical", "behavioral", "system-design"]),
  round: z.string().min(1),
  question: z.string().min(1),
  topics: z.array(z.string()),
  difficulty: z.enum(["junior", "mid", "senior"]),
  sourceType: sourceTypeSchema,
  sourceNotes: z.string(),
  title: z.string().default("Practice question"),
  tags: z.array(z.string()).default([]),
  problemDifficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  examples: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  sourceUrl: z.string().url().optional(),
  dateAdded: z.string().date(),
});

export const interviewQuestionListSchema = z.array(interviewQuestionSchema);
