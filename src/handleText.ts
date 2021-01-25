import { ObservationScope } from "./observable.js";
import { makeTextEvaluator } from "./utils.js";

export default function handleText(
  element: Node,
  data: object,
  scope: ObservationScope
) {
  if (!element.textContent) return;
  try {
    const expression = makeTextEvaluator(element.textContent);
    scope.observeAndReact(
      () => expression(data),
      (text) => (element.textContent = text)
    );
  } catch {}
}
