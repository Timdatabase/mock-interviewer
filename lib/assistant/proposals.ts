import type { CodeLanguage } from "../runner/languages";
export interface CodeProposal {
  baseCode: string;
  code: string;
  language: CodeLanguage;
}
export function canApplyProposal(
  proposal: CodeProposal,
  currentCode: string,
  language: CodeLanguage,
) {
  return (
    proposal.language === language &&
    proposal.baseCode === currentCode &&
    proposal.code !== currentCode
  );
}
export function partnerHistory(
  messages: { role: "user" | "assistant"; text: string }[],
) {
  return messages
    .slice(-8)
    .map((message) => ({
      role: message.role,
      text: message.text.slice(0, 6000),
    }));
}
