const expressionEvaluators = new Map<string, Function>();
export function makeExpressionEvaluator(expression: string) {
  return getOrAdd(
    expressionEvaluators,
    expression,
    (expression) => new Function("$data", `with($data){return ${expression};}`)
  );
}

const textEvaluators = new Map<string, Function>();
export function makeTextEvaluator(expression: string) {
  return getOrAdd(
    textEvaluators,
    expression,
    (expression) =>
      new Function("$data", `with($data){return \`${expression}\`;}`)
  );
}

const eventHandlers = new Map<string, Function>();
export function makeEventHandler(expression: string) {
  return getOrAdd(
    eventHandlers,
    expression,
    (expression) =>
      new Function("$data", `return $e => {with($data){${expression};}}`)
  );
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

function getOrAdd<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
  factory: (key: TKey) => TValue
) {
  const result = map.get(key);
  if (result) return result;
  const value = factory(key);
  map.set(key, value);
  return value;
}
