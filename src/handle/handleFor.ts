import { insertAfter } from "../domUtils.js";
import {
  makeObservable,
  ObservableObject,
  ObservationScope,
} from "../observable.js";
import { makeExpressionEvaluator } from "../utils.js";
import { HandleGenerator, Handler } from "./index.js";

interface Source {
  key: unknown;
  index: number;
  value: unknown;
  startOfItem: Node;
  endOfItem: Node;
  destroy: () => void;
}

export function* handleFor(
  element: HTMLTemplateElement,
  walk: Handler
): HandleGenerator {
  const forExpression = element.getAttribute("x-for");
  if (!forExpression) return;

  const [isFor, name, collection] =
    /^(\w+)\s+of\s+(.*)$/.exec(forExpression) ?? [];
  if (!isFor) return;

  const expression = makeExpressionEvaluator(collection);
  const keyExpression = getKeyExpression(element);

  const documentFragment = element.content;
  documentFragment.prepend(
    documentFragment.ownerDocument.createComment(`start of item`)
  );
  documentFragment.append(
    documentFragment.ownerDocument.createComment(`end of item`)
  );

  const handlers = [...walk(documentFragment, 0)];

  yield (node: Node, data: ObservableObject, scope: ObservationScope) => {
    const element = node as HTMLTemplateElement;
    const parent = element.parentNode;
    const before: Node = element.ownerDocument.createComment(
      `for (${forExpression}) {`
    );
    const after: Node = element.ownerDocument.createComment("}");
    parent!.insertBefore(before, element);
    parent!.replaceChild(after, element);

    const oldItems = new Map<unknown, Source>();
    scope.observeAndReact(
      () => Array.from(expression(data)),
      (items) => {
        const oldList = [...oldItems.values()].sort(
          (a, b) => a.index - b.index
        );
        let endOfPreviousItem = before;
        for (let index = 0; index < items.length; index++) {
          const value = items[index];
          const key = keyExpression({ [name]: value, $index: index });
          const oldItem = oldItems.get(key);
          if (!oldItem) {
            // this is a new item
            const clone = documentFragment.cloneNode(true);
            const startOfItem = clone.firstChild as Node;
            startOfItem.textContent = `start of ${index} with key ${key}`;
            const endOfItem = clone.lastChild as Node;
            endOfItem.textContent = `end of ${index}`;

            const source = (makeObservable({
              key,
              value,
              index,
              startOfItem,
              endOfItem,
            }) as unknown) as Source;

            const subData = {
              get [name]() {
                return source.value;
              },
              get $index() {
                return source.index;
              },
              $parent: data,
            };
            const { scope: subScope, destroy } = scope.createSubScope();
            source.destroy = destroy;

            // remember the childNodes so that we can send them to the handlers
            const fragmentAsNode: Node = {
              // we pretend this is a full node, but it isn't.
              // Thats fine, as it will be passed to a function that only
              // deals with childNodes
              childNodes: Array.from(clone.childNodes),
            } as any;

            insertAfter(endOfPreviousItem, clone);

            handlers.forEach((handler) =>
              handler(fragmentAsNode, subData, subScope)
            );

            endOfPreviousItem = endOfItem;
            oldItems.set(key, source);
          } else if (oldItem.index !== index) {
            // item has moved
            oldItem.index = index;
            if (oldItem.value !== value) {
              oldItem.value = value;
            }

            moveItemAfter(
              oldItem.startOfItem,
              oldItem.endOfItem,
              endOfPreviousItem
            );

            oldList.splice(oldList.indexOf(oldItem), 1);
            endOfPreviousItem = oldItem.endOfItem;
          } else {
            // item has not moved
            oldList.splice(oldList.indexOf(oldItem), 1);
            endOfPreviousItem = oldItem.endOfItem;
            if (oldItem.value !== value) {
              oldItem.value = value;
            }
          }
        }

        // remove any remaining items from before
        for (const oldItem of oldList) {
          oldItems.delete(oldItem.key);
          oldItem.destroy();
          removeItem(oldItem.startOfItem, oldItem.endOfItem);
        }
      }
    );
  };
}

const indexKeyExpression = ({ $index }: { $index: number }) => $index;

function getKeyExpression(elm: HTMLTemplateElement) {
  const key = elm.getAttribute("x-key");

  return key ? makeExpressionEvaluator(key) : indexKeyExpression;
}

function moveItemAfter(
  startOfItem: Node,
  endOfItem: Node,
  endOfPreviousItem: Node
) {
  let item = startOfItem;
  while (true) {
    const nextItem = item.nextSibling;
    insertAfter(endOfPreviousItem, item);
    endOfPreviousItem = item;
    if (item === endOfItem) break;
    if (!nextItem) break;
    item = nextItem;
  }
}

function removeItem(startOfItem: Node, endOfItem: Node) {
  let item = startOfItem;
  while (true) {
    const nextItem = item.nextSibling;
    item.parentNode!.removeChild(item);
    if (item === endOfItem) break;
    if (!nextItem) break;
    item = nextItem;
  }
}
