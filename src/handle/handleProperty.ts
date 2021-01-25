import { ObservableObject, ObservationScope } from "../observable.js";
import { makeEventHandler, makeExpressionEvaluator } from "../utils.js";

export default function* handleProperties(element: Element) {
  const attrs = Array.from(element.attributes).filter((a) =>
    a.name.startsWith(".")
  );
  for (const attr of attrs) {
    yield* handleProperty(attr);
  }
}

export function* handleProperty(attr: Attr) {
  const property = attr.name.substr(1);
  if (property.startsWith("on-")) {
    const eventHandler = makeEventHandler(attr.value);
    yield (node: Node, data: ObservableObject, scope: ObservationScope) =>
      node.addEventListener(property.substr(3), (e) => eventHandler(data, e));
  } else {
    const expression = makeExpressionEvaluator(attr.value);
    yield (node: Node, data: ObservableObject, scope: ObservationScope) =>
      scope.observeAndReact(
        () => expression(data),
        (value) => ((node as any)[property] = value)
      );
  }
}
