export interface TestCase {
  name: string;
  args: unknown[];
  expected: unknown;
}
export interface CaseResult extends TestCase {
  actual?: unknown;
  passed: boolean;
  error?: string;
}
export interface RunResult {
  cases: CaseResult[];
  logs: string[];
  durationMs: number;
  error?: string;
}
export interface RunRequest {
  language?: import("./languages").CodeLanguage;
  code: string;
  questionId: string;
  tests: TestCase[];
}
