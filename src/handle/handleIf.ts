import { makeExpressionEvaluator } from "../utils.js";
import { CreateWalker, HandleGenerator } from "./index.js";

export function* handleIf(
  element: HTMLTemplateElement,
  createWalker: CreateWalker,
  depth = 0
): HandleGenerator {
  const ifExpression = element.getAttribute("x-if");
  if (!ifExpression) return;

  const ifEvaluator = makeExpressionEvaluator(ifExpression, depth);

  const documentFragment = element.content;
  const walk = createWalker(documentFragment, depth);

  yield (node, { data, parents, scope }) => {
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
      () => ifEvaluator(data, parents),
      (show) => {
        if (show && !destroyScope) {
          const clone = documentFragment.cloneNode(true);
          const [subScope, destroy] = scope.createSubScope();
          destroyScope = destroy;

          // remember the childNodes so that we can send them to the handlers
          const fragmentAsNode: Node = {
            // we pretend this is a full node, but it isn't.
            // Thats fine, as it will be passed to a function that only
            // deals with childNodes
            childNodes: Array.from(clone.childNodes),
          } as any;

          parent!.insertBefore(clone, after);

          walk(fragmentAsNode, { data, parents, scope: subScope });
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
