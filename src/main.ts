import { createWalker } from "./handle/index.js";
import {
  globalObservationScope,
  makeObservable,
  Observable,
} from "./observable.js";
import { ensureAbsolute, isNewable } from "./utils.js";

export default function start(
  element: Element = document.documentElement,
  scope = globalObservationScope
) {
  createWalker(element, 1)(element, {}, scope);
}

export { Observable, makeObservable };

export async function applyComponent(element: Element, path: string) {
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
