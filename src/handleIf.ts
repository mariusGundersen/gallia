import { Context } from './observable.js';
import { makeExpressionEvaluator } from './utils';

export function handleIf(element: HTMLTemplateElement, data: unknown, context: Context, walk?: (node: Node, context: Context) => void) {
  const ifExpression = element.getAttribute('x-if');
  if (!ifExpression) return;

  const ifEvaluator = makeExpressionEvaluator(ifExpression);
  const parent = element.parentNode;
  const before = element.ownerDocument.createComment(`if (${ifExpression}) {`);
  const after = element.ownerDocument.createComment('}');
  parent!.insertBefore(before, element);
  parent!.replaceChild(after, element);
  let destroyContext: (() => void) | null = null;
  context.observeAndReact(() => ifEvaluator(data), show => {
    if (show && !destroyContext) {
      const clone = element.content.cloneNode(true);
      const { subContext, destroySubContext } = context.createSubContext();
      destroyContext = destroySubContext;
      parent!.insertBefore(clone, after);
      walk?.(clone, subContext);
    } else if (!show && destroyContext) {
      while (before.nextSibling !== after && before.nextSibling) {
        parent!.removeChild(before.nextSibling);
      }
      destroyContext?.();
      destroyContext = null;
    }
  });
}

