import { makeExpressionEvaluator, makeTextEvaluator } from "./utils";

test('expressionEvaluator', () => {
  const expression = makeExpressionEvaluator('45');

  expect(expression({})).toBe(45);
});


test('textEvaluator with string', () => {
  const expression = makeTextEvaluator('test');

  expect(expression({})).toBe('test');
});

test('textEvaluator with string interpolation', () => {
  const expression = makeTextEvaluator('hello ${value}');

  expect(expression({value: 'world'})).toBe('hello world');
});

test('textEvaluator with syntax error', () => {
  expect(() => makeTextEvaluator('hello ${value')).toThrow();
});