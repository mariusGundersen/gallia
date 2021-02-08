import { makeObservable } from "../observable.js";
import { ensureAbsolute, isFunction, isNewable } from "../utils.js";
import { CreateWalker, HandleGenerator } from "./index.js";

export default function* handleComponent(node: Element, createWalker: CreateWalker): HandleGenerator {
  const path = node.getAttribute("x-component") as string;
  const walk = createWalker(node);
  yield (node, data, scope) => applyComponent(node as Element, path).then((subData) => {
    const [subScope] = scope.createSubScope();

    walk(node, subData, subScope);

    if ('$mounted' in subData && isFunction(subData['$mounted'])) {
      const unmounted = subData['$mounted']();
      if (isFunction(unmounted)) {
        subScope.onDestroy(unmounted);
      }
    }

    if ('$unmounted' in subData && isFunction(subData['$unmounted'])) {
      subScope.onDestroy(() => subData['$unmounted']());
    }

  });
}

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
  component: { new(...args: any[]): any } | Function | object,
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