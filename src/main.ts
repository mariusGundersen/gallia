import { createWalker } from "./handle/index.js";
import {
  globalObservationScope,
  makeObservable,
  Observable
} from "./observable.js";

export default function start(
  element: Element = document.documentElement,
  scope = globalObservationScope
) {
  createWalker(element, -1)(element, { data: {}, parents: [], scope });
}

export { Observable, makeObservable };

