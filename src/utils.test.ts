import { makeExpressionEvaluator, makeTextEvaluator } from "./utils";

test("expressionEvaluator", () => {
  const expression = makeExpressionEvaluator("45", 0);

  expect(expression({}, [])).toBe(45);
});

test("textEvaluator with string", () => {
  const expression = makeTextEvaluator("test");

  expect(expression({}, [])).toBe("test");
});

test("textEvaluator with string interpolation", () => {
  const expression = makeTextEvaluator("hello ${value}");

  expect(expression({ value: "world" }, [])).toBe("hello world");
});

test("textEvaluator with syntax error", () => {
  expect(() => makeTextEvaluator("hello ${value")).toThrow();
});

test("textEvaluator with parent", () => {
  const expression = makeTextEvaluator("${greeting} ${value}", 1);

  expect(expression({ value: "world" }, [{ greeting: "hello" }])).toBe("hello world");
});

test("textEvaluator with $parent", () => {
  const expression = makeTextEvaluator("${$parent.value} ${value}", 1);

  expect(expression({ value: "world" }, [{ value: "hello" }])).toBe("hello world");
});