import { z } from "zod";
export const configSchema = z.object({
  company: z.string().max(80).default("Generic"),
  role: z.string().min(1).max(100).default("Software Engineer"),
  interviewType: z
    .enum(["technical", "ai-assisted", "behavioral", "system-design"])
    .default("technical"),
  difficulty: z.enum(["junior", "mid", "senior"]).default("mid"),
  problemDifficulty: z.enum(["any", "easy", "medium", "hard"]).default("any"),
  tags: z.array(z.string().max(40)).max(20).default([]),
  duration: z.coerce.number().int().min(5).max(90).default(30),
  avoidRecent: z.boolean().default(true),
  mode: z.literal("question-bank").default("question-bank"),
});
export type SessionConfig = z.infer<typeof configSchema>;
export function isCodingInterview(type: SessionConfig["interviewType"]) {
  return type === "technical" || type === "ai-assisted";
}
export const topicOptions = {
  technical: [
    "arrays",
    "strings",
    "hash-maps",
    "trees",
    "graphs",
    "dynamic-programming",
  ],
  "ai-assisted": [
    "debugging",
    "api-design",
    "data-processing",
    "refactoring",
    "testing",
  ],
  behavioral: [
    "ownership",
    "conflict",
    "teamwork",
    "failure",
    "ambiguity",
    "leadership",
  ],
  "system-design": ["scalability", "caching", "reliability"],
};
