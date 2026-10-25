// Some problems permit several correct outputs; validate their contract instead
// of comparing with one arbitrary expected answer.
export function matchesOutput(
  questionId: string,
  args: unknown[],
  actual: unknown,
  expected: unknown,
): boolean {
  if (questionId === "pair-budget") {
    const [prices, target] = args as [number[], number];
    if (!Array.isArray(actual)) return false;
    if (!actual.length) {
      const seen = new Set<number>();
      for (const price of prices) {
        if (seen.has(target - price)) return false;
        seen.add(price);
      }
      return true;
    }
    const [a, b] = actual;
    return (
      actual.length === 2 &&
      Number.isInteger(a) &&
      Number.isInteger(b) &&
      a !== b &&
      a >= 0 &&
      b >= 0 &&
      a < prices.length &&
      b < prices.length &&
      prices[a] + prices[b] === target
    );
  }
  if (questionId === "dependency-order") {
    const [tasks, prerequisites] = args as [string[], [string, string][]];
    if (!Array.isArray(actual)) return false;
    if (!actual.length) return Array.isArray(expected) && !expected.length;
    if (
      actual.length !== tasks.length ||
      new Set(actual).size !== tasks.length ||
      actual.some((t) => !tasks.includes(t))
    )
      return false;
    const position = new Map(actual.map((task, index) => [task, index]));
    return prerequisites.every(
      ([task, prerequisite]) =>
        position.get(prerequisite)! < position.get(task)!,
    );
  }
  function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [
            key,
            canonical((value as Record<string, unknown>)[key]),
          ]),
      );
    return value;
  }
  return (
    JSON.stringify(canonical(actual)) === JSON.stringify(canonical(expected))
  );
}
