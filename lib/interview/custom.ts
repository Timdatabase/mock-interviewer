import type { PublicQuestion } from "./questions";
export function parseCustomQuestions(
  text: string,
  batchId: string,
): PublicQuestion[] {
  if (text.length > 30000)
    throw new Error("Keep the question bank below 30,000 characters.");
  const prompts = text
    .split(/^\s*---\s*$/m)
    .map((value) => value.trim())
    .filter(Boolean);
  if (!prompts.length || prompts.length > 30)
    throw new Error(
      "Paste 1–30 questions, separated by a line containing ---.",
    );
  if (prompts.some((prompt) => prompt.length > 5000))
    throw new Error("Each question must be at most 5,000 characters.");
  return prompts.map((question, index) => ({
    id: `custom-${batchId}-${index}`,
    title: question.split("\n")[0].slice(0, 90),
    question,
    examples: [],
    constraints: [],
    problemDifficulty: "medium" as const,
    sourceUrl: undefined,
    starterCode:
      "function solve(...args) {\n  // Implement the function for your question.\n  \n}\n",
    testCases: [],
  }));
}
