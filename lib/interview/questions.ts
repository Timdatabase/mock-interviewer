import questions from "@/data/questions.json";
import { interviewQuestionListSchema } from "@/lib/schemas/question";
import type { InterviewConfig, InterviewQuestion } from "@/lib/interview/types";

const validatedQuestions = interviewQuestionListSchema.parse(questions);

export function getQuestionsForInterview(config: InterviewConfig): InterviewQuestion[] {
  return validatedQuestions.filter((question) => {
    const companyMatch = question.company.toLowerCase() === config.company.toLowerCase() || question.company === "Generic";
    return companyMatch && question.interviewType === config.interviewType && question.difficulty === config.difficulty;
  });
}

export function getCompanies() {
  return [...new Set(validatedQuestions.map((question) => question.company).filter((company) => company !== "Generic"))];
}
