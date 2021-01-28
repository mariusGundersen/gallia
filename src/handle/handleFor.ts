import { insertAfter } from "../domUtils.js";
import {
  makeObservable,
  ObservableObject,
  ObservationScope,
} from "../observable.js";
import { makeExpressionEvaluator, makeKeyEvaluator } from "../utils.js";
import { CreateWalker, HandleGenerator } from "./index.js";

interface Source {
  key: unknown;
  index: number;
  value: unknown;
  startOfItem: Node;
  endOfItem: Node;
  observable: {
    value: unknown;
    index: number;
  };
  destroy: () => void;
}

export function* handleFor(
  element: HTMLTemplateElement,
  createWalker: CreateWalker
): HandleGenerator {
  const forExpression = element.getAttribute("x-for");
  if (!forExpression) return;

  const [isFor, name, collection] =
    /^(\w+)\s+of\s+(.*)$/.exec(forExpression) ?? [];
  if (!isFor) return;

  const expression = makeExpressionEvaluator(collection);
  const getKey = getKeyEvaluator(name, element);

  const documentFragment = element.content;
  documentFragment.prepend(
    documentFragment.ownerDocument.createComment(`start of item`)
  );
  documentFragment.append(
    documentFragment.ownerDocument.createComment(`end of item`)
  );

  const walk = createWalker(documentFragment);

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
        const oldList: (Source | undefined)[] = [...oldItems.values()].sort(
          (a, b) => a.index - b.index
        );
        let endOfPreviousItem = before;
        for (let index = 0, length = items.length; index < length; index++) {
          const value = items[index];
          const key = getKey(value, index);
          const oldItem = oldItems.get(key);
          if (!oldItem) {
            // this is a new item
            const clone = documentFragment.cloneNode(true);
            const startOfItem = clone.firstChild as Node;
            startOfItem.textContent = `start of ${index} with key ${key}`;
            const endOfItem = clone.lastChild as Node;
            endOfItem.textContent = `end of ${index}`;

            const { scope: subScope, destroy } = scope.createSubScope();

            const source: Source = {
              key,
              value,
              index,
              startOfItem,
              endOfItem,
              destroy,
              observable: makeObservable({
                value,
                index,
              }),
            };

            const subData = createSubData(data, name, source);

            // remember the childNodes so that we can send them to the handlers
            const fragment = rememberTheChildren(clone);

            insertAfter(endOfPreviousItem, clone);

            walk(fragment, subData, subScope);

            endOfPreviousItem = endOfItem;
            oldItems.set(key, source);
          } else if (oldItem.index !== index) {
            // item has moved
            const oldIndex = oldItem.index;
            oldItem.index = index;
            oldItem.observable.index = index;
            if (oldItem.value !== value) {
              oldItem.value = value;
              oldItem.observable.value = value;
            }

            moveItemAfter(
              oldItem.startOfItem,
              oldItem.endOfItem,
              endOfPreviousItem
            );

            oldList[oldIndex] = undefined;
            endOfPreviousItem = oldItem.endOfItem;
          } else {
            // item has not moved
            oldList[oldItem.index] = undefined;
            endOfPreviousItem = oldItem.endOfItem;
            if (oldItem.value !== value) {
              oldItem.value = value;
              oldItem.observable.value = value;
            }
          }
        }

        // remove any remaining items from before
        for (let i = 0, l = oldList.length; i < l; i++) {
          const oldItem = oldList[i];
          if (!oldItem) continue;
          oldItems.delete(oldItem.key);
          oldItem.destroy();
          removeItem(oldItem.startOfItem, oldItem.endOfItem);
        }
      }
    );
  };
}

const indexKeyExpression = (_: unknown, $index: number) => $index;

function createSubData(data: ObservableObject, name: string, source: Source) {
  return Object.create(data, {
    [name]: {
      get() {
        return source.observable.value;
      },
    },
    $index: {
      get() {
        return source.observable.index;
      },
    },
    $parent: {
      get() {
        return data;
      },
    },
  });
}

function rememberTheChildren(clone: Node): Node {
  return {
    childNodes: Array.from(clone.childNodes),
  } as any;
}

function getKeyEvaluator(itemName: string, elm: HTMLTemplateElement) {
  const keyExpression = elm.getAttribute("x-key");

  return keyExpression
    ? makeKeyEvaluator(itemName, keyExpression)
    : indexKeyExpression;
}

function moveItemAfter(
  startOfItem: Node,
  endOfItem: Node,
  endOfPreviousItem: Node
) {
  if (endOfPreviousItem.nextSibling === startOfItem) return;
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
