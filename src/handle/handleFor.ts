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
          if (oldItem?.index === index) {
            // console.log("item has not moved", index, value);
            // item has not moved
            oldList.splice(oldList.indexOf(oldItem), 1);
            endOfPreviousItem = oldItem.endOfItem;
            if (oldItem.value !== value) {
              oldItem.value = value;
            }
          } else if (!oldItem) {
            // console.log("new item", index, value);
            // this is a new item
            // insert it at the current position
            const clone = documentFragment.cloneNode(true);
            const cloneChildren = Array.from(clone.childNodes);
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

            const subData = Object.create(data, {
              [name]: {
                get() {
                  return source.value;
                },
              },
              $index: {
                get() {
                  return source.index;
                },
              },
            });
            const { scope: subScope, destroy } = scope.createSubScope();
            source.destroy = destroy;
            insertAfter(endOfPreviousItem, clone);

            for (const handler of handlers) {
              handler(
                ({ childNodes: cloneChildren } as unknown) as Node,
                subData,
                subScope
              );
            }
            endOfPreviousItem = endOfItem;
            oldItems.set(key, source);
          } else {
            // console.log("item has moved from", oldItem.index, "to", index, value);
            // item has moved
            // move dom elements
            oldItem.index = index;
            if (oldItem.value !== value) {
              oldItem.value = value;
            }

            let item = oldItem.startOfItem;
            do {
              const nextItem = item.nextSibling;
              insertAfter(endOfPreviousItem, item);
              endOfPreviousItem = item;
              if (!nextItem) break;
              item = nextItem;
            } while (item !== oldItem.endOfItem);

            oldList.splice(oldList.indexOf(oldItem), 1);
          }
        }

        // remove any remaining items from before
        for (const oldItem of oldList) {
          // console.log("item has been removed", oldItem.index);
          oldItems.delete(oldItem.key);
          oldItem.destroy();
          let item = oldItem.startOfItem;
          do {
            const nextItem = item.nextSibling;
            item.parentNode!.removeChild(item);
            if (!nextItem) break;
            item = nextItem;
          } while (item !== oldItem.endOfItem);
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
