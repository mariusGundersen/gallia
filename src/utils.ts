const expressionEvaluators = new Map<string, Function>();
export function makeExpressionEvaluator(expression: string) {
  return getOrAdd(
    expressionEvaluators,
    expression,
    (expression) => new Function("$data", `with($data){return ${expression}}`)
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
      new Function("$data", "$e", `with($data){return ${expression};}`)
  );
}

export function isNewable(
  component: Function | (new (...args: any[]) => any)
): component is new (...args: any[]) => any {
  return component.toString().startsWith("class");
}

export function ensureAbsolute(path: string) {
  // Ensure the path starts with /, so that we don't load anything relative to this module
  return path.startsWith("/") ? path : "/" + path;
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
