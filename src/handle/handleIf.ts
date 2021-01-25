import { ObservableObject, ObservationScope } from "../observable.js";
import { makeExpressionEvaluator } from "../utils.js";
import { HandleGenerator, Handler } from "./index.js";

export function* handleIf(
  element: HTMLTemplateElement,
  walk: Handler
): HandleGenerator {
  const ifExpression = element.getAttribute("x-if");
  if (!ifExpression) return;

  const ifEvaluator = makeExpressionEvaluator(ifExpression);

  const documentFragment = element.content;
  const handlers = [...walk(documentFragment, 0)];

  yield (node: Node, data: ObservableObject, scope: ObservationScope) => {
    const element = node as HTMLTemplateElement;
    const parent = element.parentNode;
    const before = element.ownerDocument.createComment(
      `if (${ifExpression}) {`
    );
    const after = element.ownerDocument.createComment("}");
    parent!.insertBefore(before, element);
    parent!.replaceChild(after, element);
    let destroyScope: (() => void) | null = null;
    scope.observeAndReact(
      () => ifEvaluator(data),
      (show) => {
        if (show && !destroyScope) {
          const clone = documentFragment.cloneNode(true);
          const childNodes = Array.from(clone.childNodes);
          const { scope: subScope, destroy } = scope.createSubScope();
          destroyScope = destroy;
          parent!.insertBefore(clone, after);
          for (const handler of handlers) {
            handler(({ childNodes } as unknown) as Node, data, subScope);
          }
        } else if (!show && destroyScope) {
          while (before.nextSibling !== after && before.nextSibling) {
            parent!.removeChild(before.nextSibling);
          }
          destroyScope();
          destroyScope = null;
        }
      }
    );
  };
}
