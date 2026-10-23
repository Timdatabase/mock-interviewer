export type CodeLanguage = "javascript" | "typescript" | "python";
export const languages = [
  { id: "javascript", label: "JavaScript", file: "solution.js" },
  { id: "typescript", label: "TypeScript", file: "solution.ts" },
  { id: "python", label: "Python", file: "solution.py" },
] as const;
export function starterFor(
  language: CodeLanguage,
  question: { starterCode: string },
) {
  const params =
    question.starterCode.match(/function solve\(([^)]*)\)/)?.[1] || "...args";
  if (language === "python")
    return `def solve(${params.replace("...args", "*args")}):\n    # Explain your approach, then implement it here.\n    # Tree nodes are dictionaries: root["val"], root["left"], root["right"].\n    pass\n`;
  if (language === "typescript") {
    const typed =
      params === "...args"
        ? "...args: any[]"
        : params
            .split(",")
            .map((param) => `${param.trim()}: any`)
            .join(", ");
    return `function solve(${typed}): any {\n  // Add specific types as you develop your approach.\n  \n}\n`;
  }
  return question.starterCode;
}
