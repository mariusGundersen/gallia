import {
  isDocumentFragment,
  isElement,
  isTemplateElement,
  isTextNode,
} from "../domUtils.js";
import { applyComponent } from "../main.js";
import { ObservableObject, ObservationScope } from "../observable.js";
import handleAttributes from "./handleAttribute.js";
import { handleFor } from "./handleFor.js";
import { handleIf } from "./handleIf.js";
import handleProperties from "./handleProperty.js";
import handleText from "./handleText.js";

export type Handle = (
  node: Node,
  data: ObservableObject,
  scope: ObservationScope
) => void;

export type HandleGenerator = Generator<Handle>;

export type Handler = (node: Node, depth: number) => HandleGenerator;

export default function* handle(node: Node, depth = 0): HandleGenerator {
  if (isDocumentFragment(node)) {
    yield* recurse(node, depth + 1);
  } else if (isTextNode(node)) {
    yield* handleText(node);
  } else if (isElement(node)) {
    const path = node.getAttribute("x-component");
    if (path && depth > 0) {
      const walk = createWalker(node);
      yield (node, data, scope) =>
        applyComponent(node as Element, path).then((subData) => {
          const { scope: subScope } = scope.createSubScope();
          walk(node, subData, subScope);
        });
    } else if (isTemplateElement(node)) {
      yield* handleFor(node, createWalker);
      yield* handleIf(node, createWalker);
    } else {
      yield* handleAttributes(node);
      yield* handleProperties(node);
      yield* recurse(node, depth + 1);
    }
  }
}

export type CreateWalker = typeof createWalker;
export function createWalker(node: Node, depth = 0) {
  const handlers = Array.from(handle(node, depth));
  return (node: Node, data: ObservableObject, scope: ObservationScope) => {
    for (let i = 0, l = handlers.length; i < l; i++) {
      handlers[i](node, data, scope);
    }
  };
}

function* recurse(node: Node, depth: number) {
  for (let i = 0; i < node.childNodes.length; i++) {
    for (const handler of handle(node.childNodes[i], depth)) {
      yield (node: Node, data: ObservableObject, scope: ObservationScope) =>
        handler(node.childNodes[i], data, scope);
    }
  }
}
