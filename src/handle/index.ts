import {
  isDocumentFragment,
  isElement,
  isTemplateElement,
  isTextNode
} from "../domUtils.js";
import { ObservableObject, ObservationScope } from "../observable.js";
import handleAttributes from "./handleAttribute.js";
import handleComponent, { isComponentNode } from "./handleComponent.js";
import { handleFor } from "./handleFor.js";
import { handleIf } from "./handleIf.js";
import handleProperties from "./handleProperty.js";
import handleText from "./handleText.js";

export interface HandlerContext {
  data: ObservableObject,
  parents: ObservableObject[],
  scope: ObservationScope
}

export type Handle = (node: Node, context: HandlerContext) => void;

export type HandleGenerator = Generator<Handle>;

export type Handler = (node: Node, depth: number) => HandleGenerator;

export default function* handle(node: Node, depth = 0): HandleGenerator {
  if (isDocumentFragment(node)) {
    yield* recurse(node, depth);
  } else if (isTextNode(node)) {
    yield* handleText(node, depth);
  } else if (isElement(node)) {
    if (isComponentNode(node)) {
      yield* handleComponent(node, createWalker, depth);
    } else if (isTemplateElement(node)) {
      yield* handleFor(node, createWalker, depth);
      yield* handleIf(node, createWalker, depth);
    } else {
      yield* handleAttributes(node, depth);
      yield* handleProperties(node, depth);
      yield* recurse(node, depth);
    }
  }
}

export type CreateWalker = typeof createWalker;

export function createWalker(node: Node, depth = 0): Handle {
  const handlers = [...handle(node, depth)];
  return (node, context) => {
    for (let i = 0, l = handlers.length; i < l; i++) {
      handlers[i](node, context);
    }
  };
}

function* recurse(node: Node, depth: number): HandleGenerator {
  for (let i = 0; i < node.childNodes.length; i++) {
    for (const handler of handle(node.childNodes[i], depth)) {
      yield (node, context) =>
        handler(node.childNodes[i], context);
    }
  }
}
