// @ts-check
import { isElement, isTemplateElement } from "./domUtils";
import domWalk, { DomWalker } from "./domWalk.js";
import handleAttributes from "./handleAttribute.js";
import { handleFor } from "./handleFor";
import { handleIf } from "./handleIf";
import handleProperties from "./handleProperty.js";
import handleText from "./handleText.js";
import { globalObservationScope, ObservationScope } from "./observable";

Promise.all(
  Array.from(document.querySelectorAll("[x-component]")).map((e) =>
    applyComponent(e)
  )
).catch((e) => console.error(e));

async function applyComponent(root: Element, parent?: ObservationScope) {
  const path = root.getAttribute("x-component");

  if (!path) return;

  // load the component
  const componentFactory = await loadComponent(path);

  // child components are handled by the parent component
  // but now we have preloaded the component
  if (!parent && root.parentElement!.closest("[x-component]")) return;

  const model = getModel(root.getAttribute("x-model"));

  const component = instantiateComponent(componentFactory, model);

  domWalk(root, handle(globalObservationScope));

  if (
    "$mounted" in globalObservationScope.data &&
    typeof globalObservationScope.data.$mounted === "function"
  ) {
    globalObservationScope.data.$mounted();
  }
}

class Walker extends DomWalker {
  constructor(node: Node, data: unknown, depth = 0) {
    super(node, depth);
  }
  visit(node: Node, depth: number): boolean | undefined {
    if (node.nodeName === "#document-fragment") return true;
    if (node.nodeName === "#text") {
      handleText(node, this.data, globalObservationScope);
      return false;
    }

    if (!isElement(node)) return false;

    if (isTemplateElement(node)) {
      handleFor(node, globalObservationScope, handle);
      handleIf(node, globalObservationScope, handle);
      return false;
    }

    if (depth > 0 && node.hasAttribute("x-component")) {
      applyComponent(node, globalObservationScope).catch((e) =>
        console.error(e)
      );
      return false;
    }

    handleAttributes(node, data, globalObservationScope);
    handleProperties(node, data, globalObservationScope);
  }
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

/**
 * Ensure the path starts with /, so that we don't load anything relative to this module
 */
function ensureAbsolute(path: string) {
  return path.startsWith("/") ? path : "/" + path;
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

function isNewable(
  component: Function | (new (...args: any[]) => any)
): component is new (...args: any[]) => any {
  return component.toString().startsWith("class");
}
