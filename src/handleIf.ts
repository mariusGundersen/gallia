import { ObservableObject, ObservationScope } from "./observable.js";
import { makeExpressionEvaluator } from "./utils.js";

export function handleIf(
  element: HTMLTemplateElement,
  data: ObservableObject,
  scope: ObservationScope,
  walk?: (node: Node, data: ObservableObject, scope: ObservationScope) => void
) {
  const ifExpression = element.getAttribute("x-if");
  if (!ifExpression) return;

  const ifEvaluator = makeExpressionEvaluator(ifExpression);
  const parent = element.parentNode;
  const before = element.ownerDocument.createComment(`if (${ifExpression}) {`);
  const after = element.ownerDocument.createComment("}");
  parent!.insertBefore(before, element);
  parent!.replaceChild(after, element);
  let destroyScope: (() => void) | null = null;
  scope.observeAndReact(
    () => ifEvaluator(data),
    (show) => {
      if (show && !destroyScope) {
        const clone = element.content.cloneNode(true);
        const { scope: subScope, destroy } = scope.createSubScope();
        destroyScope = destroy;
        parent!.insertBefore(clone, after);
        walk?.(clone, data, subScope);
      } else if (!show && destroyScope) {
        while (before.nextSibling !== after && before.nextSibling) {
          parent!.removeChild(before.nextSibling);
        }
        destroyScope();
        destroyScope = null;
      }
    }
  );
}
