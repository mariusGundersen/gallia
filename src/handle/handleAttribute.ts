import { ObservableObject, ObservationScope } from "../observable.js";
import { makeExpressionEvaluator } from "../utils.js";

export default function* handleAttributes(element: Element) {
  const attrs = Array.from(element.attributes).filter((a) =>
    a.name.startsWith("@")
  );
  for (const attr of attrs) {
    yield* handleAttribute(attr);
  }
}

export function* handleAttribute(attr: Attr) {
  const name = attr.name.substr(1);
  const expression = makeExpressionEvaluator(attr.value);
  yield (node: Node, data: ObservableObject, scope: ObservationScope) =>
    scope.observeAndReact(
      () => expression(data),
      (value) => (node as Element).setAttribute(name, value)
    );
}
