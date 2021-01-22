import { ObservationScope } from "./observable";
import { makeTextEvaluator } from "./utils";

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
