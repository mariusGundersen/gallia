import { makeExpressionEvaluator } from "../utils.js";
import { HandleGenerator } from "./index.js";

export default function* handleAttributes(element: Element, depth = 0): HandleGenerator {
  const attrs = Array.from(element.attributes).filter((a) =>
    a.name.startsWith("@")
  );
  for (const attr of attrs) {
    yield* handleAttribute(attr, depth);
  }
}

export function* handleAttribute(attr: Attr, depth: number): HandleGenerator {
  const name = attr.name.substr(1);
  const expression = makeExpressionEvaluator(attr.value, depth);
  yield (node, { data, scope, parents }) =>
    scope.observeAndReact(
      () => expression(data, parents),
      (value) => (node as Element).setAttribute(name, value)
    );
}
