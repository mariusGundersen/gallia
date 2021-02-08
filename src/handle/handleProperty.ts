import { makeEventHandler, makeExpressionEvaluator } from "../utils.js";
import { HandleGenerator } from "./index.js";

export default function* handleProperties(element: Element, depth = 0): HandleGenerator {
  const attrs = Array.from(element.attributes).filter((a) =>
    a.name.startsWith(".")
  );
  for (const attr of attrs) {
    yield* handleProperty(attr, depth);
  }
}

export function* handleProperty(attr: Attr, depth: number): HandleGenerator {
  const property = attr.name.substr(1);
  if (property.startsWith("on-")) {
    const type = property.substr(3);
    const eventHandler = makeEventHandler(attr.value, depth);
    yield (node, { data, parents, scope }) => {
      console.log('eventHandler', data, parents);
      const handler = eventHandler(data, parents);
      node.addEventListener(type, handler);
      scope.onDestroy(() => node.removeEventListener(type, handler));
    };
  } else {
    const expression = makeExpressionEvaluator(attr.value, depth);
    yield (node, { data, parents, scope }) =>
      scope.observeAndReact(
        () => expression(data, parents),
        (value) => ((node as any)[property] = value)
      );
  }
}
