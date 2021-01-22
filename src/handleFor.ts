import { insertAfter } from "./domUtils";
import {
  makeObservable,
  ObservableObject,
  ObservationScope,
} from "./observable";
import { makeExpressionEvaluator } from "./utils";

interface Source {
  key: unknown;
  index: number;
  value: unknown;
  startOfItem: Node;
  endOfItem: Node;
  destroy: () => void;
}

export function handleFor(
  element: HTMLTemplateElement,
  data: ObservableObject,
  scope: ObservationScope,
  walk?: (node: Node, data: ObservableObject, scope: ObservationScope) => void
) {
  const forExpression = element.getAttribute("x-for");
  if (!forExpression) return;

  const [isFor, name, collection] =
    /^(\w+)\s+of\s+(.*)$/.exec(forExpression) ?? [];
  if (!isFor) return;

  const expression = makeExpressionEvaluator(collection);
  const parent = element.parentNode;
  const before: Node = element.ownerDocument.createComment(
    `for (${forExpression}) {`
  );
  const after: Node = element.ownerDocument.createComment("}");
  parent!.insertBefore(before, element);
  parent!.replaceChild(after, element);

  const keyExpression = getKeyExpression(element);

  const oldItems = new Map<unknown, Source>();
  scope.observeAndReact(
    () => expression(data),
    (items) => {
      const oldList = [...oldItems.values()].sort((a, b) => a.index - b.index);
      let endOfPreviousItem = before;
      let index = 0;
      for (const value of items) {
        const key = keyExpression({ [name]: value, $index: index });
        const oldItem = oldItems.get(key);
        if (oldItem?.index === index) {
          console.log("item has not moved", index, value);
          // item has not moved
          oldList.splice(oldList.indexOf(oldItem), 1);
          endOfPreviousItem = oldItem.endOfItem;
          if (oldItem.value !== value) {
            oldItem.value = value;
          }
        } else if (!oldItem) {
          console.log("new item", index, value);
          // this is a new item
          // insert it at the current position
          const clone = element.content.cloneNode(true);
          const startOfItem = element.ownerDocument.createComment(
            `start of ${index} with key ${key}`
          );
          const endOfItem = element.ownerDocument.createComment(
            `end of ${index}`
          );

          const source = ({
            key,
            value,
            index,
            startOfItem,
            endOfItem,
          } as unknown) as Source;
          const subData = Object.create(
            data,
            makeObservable({
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
            })
          );
          const { scope: subScope, destroy } = scope.createSubScope();
          source.destroy = destroy;
          walk?.(clone, subData, subScope);
          clone.appendChild(endOfItem);
          clone.insertBefore(startOfItem, clone.firstChild);
          insertAfter(endOfPreviousItem, clone);
          endOfPreviousItem = endOfItem;
          oldItems.set(key, source);
        } else {
          console.log("item has moved from", oldItem.index, "to", index, value);
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

        index++;
      }

      // remove any remaining items from before
      for (const oldItem of oldList) {
        console.log("item has been removed", oldItem.index);
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
}

const indexKeyExpression = ({ $index }: { $index: number }) => $index;

function getKeyExpression(elm: HTMLTemplateElement) {
  const key = elm.getAttribute("x-key");

  return key ? makeExpressionEvaluator(key) : indexKeyExpression;
}
