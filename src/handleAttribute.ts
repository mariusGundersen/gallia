import { ObservationScope } from "./observable.js";
import { makeExpressionEvaluator } from "./utils.js";

export default function handleAttributes(
  element: Element,
  data: object,
  scope: ObservationScope
) {
  Array.from(element.attributes)
    .filter((a) => a.name.startsWith("@"))
    .forEach((a) => handleAttribute(a, data, scope));
}

export function handleAttribute(
  attr: Attr,
  data: object,
  scope: ObservationScope
) {
  const element = attr.ownerElement;
  const name = attr.name.substr(1);
  const expression = makeExpressionEvaluator(attr.value);
  scope.observeAndReact(
    () => expression(data),
    (value) => element!.setAttribute(name, value)
  );
}
