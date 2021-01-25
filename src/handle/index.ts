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
      const handlers = [...handle(node, 0)];
      yield (node, data, scope) =>
        applyComponent(node as Element, path).then((subData) => {
          const { scope: subScope } = scope.createSubScope();
          for (const handler of handlers) {
            handler(node, subData, subScope);
          }
        });
    } else if (isTemplateElement(node)) {
      yield* handleFor(node, handle);
      yield* handleIf(node, handle);
    } else {
      yield* handleAttributes(node);
      yield* handleProperties(node);
      yield* recurse(node, depth + 1);
    }
  }
}

function* recurse(node: Node, depth: number) {
  for (let i = 0; i < node.childNodes.length; i++) {
    for (const handler of handle(node.childNodes[i], depth)) {
      yield (node: Node, data: ObservableObject, scope: ObservationScope) =>
        handler(node.childNodes[i], data, scope);
    }
  }
}
