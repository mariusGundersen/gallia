import { insertAfter } from "../domUtils.js";
import listDiff from "../listDiff.js";
import {
  makeObservable
} from "../observable.js";
import { makeExpressionEvaluator, makeKeyEvaluator } from "../utils.js";
import { CreateWalker, HandleGenerator } from "./index.js";

interface Source {
  value: unknown;
  startOfItem: Node;
  endOfItem: Node;
  observable: {
    [k: string]: unknown;
    $index: number;
  };
  destroy: () => void;
}

export function* handleFor(
  element: HTMLTemplateElement,
  createWalker: CreateWalker,
  depth = 0
): HandleGenerator {
  const forExpression = element.getAttribute("x-for");
  if (!forExpression) return;

  const [isFor, name, collection] =
    /^(\w+)\s+of\s+(.*)$/.exec(forExpression) ?? [];
  if (!isFor) return;

  const expression = makeExpressionEvaluator(collection, depth);
  const getKey = getKeyEvaluator(name, element);

  const documentFragment = element.content;
  documentFragment.prepend(
    documentFragment.ownerDocument.createComment(`start of item`)
  );
  documentFragment.append(
    documentFragment.ownerDocument.createComment(`end of item`)
  );

  const walk = createWalker(documentFragment, depth + 1);

  yield (node, { data, parents, scope }) => {
    const element = node as HTMLTemplateElement;
    const parent = element.parentNode;
    const before: Node = element.ownerDocument.createComment(
      `for (${forExpression}) {`
    );
    const after: Node = element.ownerDocument.createComment("}");
    parent!.insertBefore(before, element);
    parent!.replaceChild(after, element);

    let oldList: unknown[] = [];
    let oldMap = new Map<unknown, number>();
    const keyedValues = new Map<unknown, Source>();
    scope.observeAndReact(
      () => expression(data, parents) as unknown[],
      (items) => {
        let index = 0;
        let endOfPreviousItem = before;
        const currentList = items.map(getKey);

        oldMap = listDiff(oldList, oldMap, currentList, {
          insert(key, i) {
            const value = items[i];
            const clone = documentFragment.cloneNode(true);
            const startOfItem = clone.firstChild as Node;
            startOfItem.textContent = `start of ${index} with key ${key}`;
            const endOfItem = clone.lastChild as Node;
            endOfItem.textContent = `end of ${index}`;

            const [subScope, destroy] = scope.createSubScope();

            const source: Source = {
              value,
              startOfItem,
              endOfItem,
              destroy,
              observable: makeObservable({
                [name]: value,
                $index: index,
              }),
            };

            keyedValues.set(key, source);

            // remember the childNodes so that we can send them to the handlers
            const fragment = rememberTheChildren(clone);

            insertAfter(endOfPreviousItem, clone);

            walk(fragment, { data: source.observable, parents: [data, ...parents], scope: subScope });

            endOfPreviousItem = endOfItem;
            index++;
          },
          move(key, i) {
            const value = items[i];
            const source = keyedValues.get(key) as Source;
            source.observable.$index = index;
            if (source.value !== value) {
              source.value = value;
              source.observable[name] = value;
            }

            moveItemAfter(
              source.startOfItem,
              source.endOfItem,
              endOfPreviousItem
            );

            endOfPreviousItem = source.endOfItem;
            index++;
          },
          noop(key, i) {
            // item has not moved
            const value = items[i];
            const source = keyedValues.get(key) as Source;
            if (source.observable.$index !== index) {
              source.observable.$index = index;
            }
            if (source.value !== value) {
              source.value = value;
              source.observable[name] = value;
            }

            endOfPreviousItem = source.endOfItem;
            index++;
          },
          remove(key) {
            const source = keyedValues.get(key) as Source;
            source.destroy();
            removeItem(source.startOfItem, source.endOfItem);
            keyedValues.delete(key);
          },
        });

        oldList = currentList;
      }
    );
  };
}

const indexKeyExpression = (_: unknown, $index: number) => $index as unknown;

function rememberTheChildren(clone: Node): Node {
  const list = clone.childNodes;
  const count = list.length;
  const childNodes = new Array(count);

  for (let i = 0; i < count; i++) {
    childNodes[i] = list[i];
  }

  return {
    childNodes,
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
