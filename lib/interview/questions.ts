import "server-only";
import questions from "@/data/questions.json";
import { interviewQuestionListSchema } from "@/lib/schemas/question";
import type { SessionConfig } from "./config";
const bank = interviewQuestionListSchema.parse(questions);
export function matchingQuestions(config: SessionConfig) {
  return bank.filter(
    (q) =>
      (config.company === "Generic" ||
        q.company === "Generic" ||
        q.company.toLowerCase() === config.company.toLowerCase()) &&
      q.interviewType === config.interviewType &&
      (config.interviewType !== "technical" ||
        config.problemDifficulty === "any" ||
        q.problemDifficulty === config.problemDifficulty) &&
      (!config.tags.length || config.tags.some((t) => q.tags.includes(t))),
  );
}
export function publicQuestion(q: (typeof bank)[number]) {
  return {
    id: q.id,
    title: q.title,
    question: q.question,
    examples: q.examples,
    constraints: q.constraints,
    problemDifficulty: q.problemDifficulty,
    sourceUrl: q.sourceUrl,
    starterCode: q.starterCode,
    testCases: q.testCases,
  };
}
export type PublicQuestion = ReturnType<typeof publicQuestion>;
