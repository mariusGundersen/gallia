import { ObservableObject, ObservationScope } from "../observable.js";
import { makeTextEvaluator } from "../utils.js";

export default function* handleText(element: Text, depth = 0) {
  if (!element.textContent) return;

  try {
    const expression = makeTextEvaluator(element.textContent);

    yield (node: Node, data: ObservableObject, scope: ObservationScope) =>
      scope.observeAndReact(
        () => expression(data),
        (text) => (node.textContent = text)
      );
  } catch {}
}
