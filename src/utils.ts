import { ObservableObject } from "./observable";

export type ExpressionFunction<T> = (data: ObservableObject, parents: ObservableObject[]) => T;
export type ExpressionFunctionFactory<T> = (expression: string) => ExpressionFunction<T>;

export function makeExpressionEvaluator(expression: string, parentCount = 0) {
  return new Function("$this", "$parents", buildClosure(`return ${expression};`, parentCount)) as ExpressionFunction<any>;
}

export function makeTextEvaluator(expression: string, parentCount = 0) {
  return new Function("$this", "$parents", buildClosure(`return \`${expression}\`;`, parentCount)) as ExpressionFunction<string>;
}

export function makeEventHandler(expression: string, parentCount = 0) {
  return new Function("$this", "$parents", `return $e => {${buildClosure(expression, parentCount)}}`) as ExpressionFunction<(e: any) => void>;
}

export function makeKeyEvaluator(itemName: string, expression: string) {
  return new Function(itemName, "$index", `return ${expression};`) as (
    value: unknown,
    index: number
  ) => unknown;
}

export function isNewable(
  component: Function | (new (...args: any[]) => any)
): component is new (...args: any[]) => any {
  return component.toString().startsWith("class");
}

export function isFunction(value: any): value is Function {
  return typeof value === "function";
}

export function ensureAbsolute(path: string) {
  // Ensure the path starts with /, so that we don't load anything relative to this module
  if (path.startsWith('./')) {
    return new URL(path, document.location.href).pathname;
  }

  return path;
}

export function buildClosure(expression: string, depth = 0): string {
  if (depth === 0) {
    return `with($this){${expression}}`;
  }

  if (depth === 1) {
    return `with($parents[0]){const $parent = $parents[0];${buildClosure(expression, 0)}}`;
  }

  return `with($parents[${depth - 1}]){${buildClosure(expression, depth - 1)}}`;
}