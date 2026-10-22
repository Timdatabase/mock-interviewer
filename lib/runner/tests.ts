import type { TestCase } from "./types";
export function parseTests(text: string): TestCase[] {
  if (text.length > 50000)
    throw new Error("Keep test input below 50,000 characters.");
  const tests = JSON.parse(text);
  if (!Array.isArray(tests) || !tests.length || tests.length > 30)
    throw new Error("Provide an array of 1–30 test cases.");
  if (
    tests.some(
      (test) =>
        !test ||
        typeof test.name !== "string" ||
        !Array.isArray(test.args) ||
        !Object.hasOwn(test, "expected"),
    )
  )
    throw new Error(
      "Each test needs a name, an args array, and an expected value.",
    );
  return tests;
}
