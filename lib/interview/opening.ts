import type { SessionConfig } from "./config";
export function buildInterviewOpening(config: SessionConfig, question: string) {
  const format =
    config.interviewType === "ai-assisted"
      ? "This is an AI-assisted coding round. You may use Patch, your coding partner, to plan, write, debug, and review code. I’m your interviewer: I’ll ask about your decisions, how you review AI suggestions, and how you verify the result. We’ll clarify the task, delegate useful work, review and test the code, then debrief."
      : config.interviewType === "technical"
        ? "First we’ll clarify the problem, then discuss your approach, write code, and check a few test cases."
        : config.interviewType === "behavioral"
          ? "I’ll ask about your experience, then follow up on your actions, results, and what you learned."
          : "We’ll clarify requirements, sketch a design, and explore tradeoffs and failure cases.";
  const spokenQuestion =
    question.length > 1800
      ? `${question.slice(0, 1400)}. The complete question is in your workspace; take a moment to read it.`
      : question;
  return `Hi, I’m Sam, your mock interviewer. We have about ${config.duration} minutes together. ${format} You can think out loud or type and send your approach. I’ll follow your work and ask one question at a time. Take your time—this is practice. Here’s our first question: ${spokenQuestion} Before jumping in, what would you like to clarify?`;
}
export function buildApproachMessage(notes: string) {
  const approach = notes.trim();
  if (!approach)
    throw new Error("Write your approach before sending it to Sam.");
  return `Here is my approach:\n${approach}\n\nPlease respond to this approach: acknowledge my reasoning, then ask one specific follow-up before I continue. Don’t give away the solution.`;
}
