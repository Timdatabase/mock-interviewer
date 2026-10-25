import "server-only";
import questions from "@/data/questions.json";
import aiTasks from "@/data/ai-tasks.json";
import { isCodingInterview } from "./config";
import { interviewQuestionListSchema } from "@/lib/schemas/question";
import type { SessionConfig } from "./config";
const bank = interviewQuestionListSchema.parse([...questions, ...aiTasks]);
export function matchingQuestions(config: SessionConfig) {
  return bank.filter(
    (q) =>
      (config.company === "Generic" ||
        q.company === "Generic" ||
        q.company.toLowerCase() === config.company.toLowerCase()) &&
      q.interviewType === config.interviewType &&
      (!isCodingInterview(config.interviewType) ||
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
    starterCodes: q.starterCodes,
    taskKind: q.taskKind,
    testCases: q.testCases,
  };
}
export type PublicQuestion = ReturnType<typeof publicQuestion>;
