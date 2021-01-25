import { isElement, isTemplateElement } from "./domUtils.js";
import handleAttributes from "./handleAttribute.js";
import { handleFor } from "./handleFor.js";
import { handleIf } from "./handleIf.js";
import handleProperties from "./handleProperty.js";
import handleText from "./handleText.js";
import {
  globalObservationScope,
  makeObservable,
  Observable,
  ObservableObject,
  ObservationScope,
} from "./observable.js";
import { ensureAbsolute, isNewable } from "./utils.js";

export default function start(
  element: Element = document.documentElement,
  scope = globalObservationScope
) {
  handle(element, {}, scope, 1);
}

export { Observable, makeObservable };

function handle(
  node: Node,
  data: ObservableObject,
  scope: ObservationScope,
  depth = 0
) {
  if (node.nodeName === "#document-fragment") {
    for (const childNode of Array.from(node.childNodes)) {
      handle(childNode, data, scope, depth + 1);
    }
  } else if (node.nodeName === "#text") {
    handleText(node, data, scope);
  } else if (isElement(node)) {
    const path = node.getAttribute("x-component");
    if (path && depth > 0) {
      applyComponent(node, path).then((data) => {
        handle(node, data, scope, 0);
      });
    } else if (isTemplateElement(node)) {
      handleFor(node, data, scope, handle);
      handleIf(node, data, scope, handle);
    } else {
      handleAttributes(node, data, scope);
      handleProperties(node, data, scope);
      for (const childNode of Array.from(node.childNodes)) {
        handle(childNode, data, scope, depth + 1);
      }
    }
  }
}

async function applyComponent(element: Element, path: string) {
  // load the component
  const componentFactory = await loadComponent(path);

  const model = getModel(element.getAttribute("x-model"));

  const component = instantiateComponent(componentFactory, model);

  return makeObservable(component);
}

function getModel(model: string | null) {
  try {
    return (
      (model && typeof model === "string" && JSON.parse(model)) || undefined
    );
  } catch (e) {
    throw new Error(`Failed to parse x-model ${model},\n${e.message}`);
  }
}

async function loadComponent(path: string) {
  try {
    const module = await import(ensureAbsolute(path));
    return module.default;
  } catch (e) {
    throw new Error(`Could not load component ${path},\n${e.message}`);
  }
}

function instantiateComponent(
  component: { new (...args: any[]): any } | Function | object,
  model: any
) {
  if (typeof component === "function") {
    if (isNewable(component)) {
      return new component(model);
    } else {
      return component(model);
    }
  } else {
    return component;
  }
}
