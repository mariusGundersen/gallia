import { Context } from "./observable";
import { makeExpressionEvaluator } from "./utils";

export default function handleAttributes(element: Element, data: unknown, context: Context){
  Array
    .from(element.attributes)
    .filter(a => a.name.startsWith('@'))
    .forEach(a => handleAttribute(a, data, context));
}

export function handleAttribute(attr: Attr, data: unknown, context: Context){
  const element = attr.ownerElement;
  const name = attr.name.substr(1);
  const expression = makeExpressionEvaluator(attr.value);
  context.observeAndReact(() => expression(data), value => element!.setAttribute(name, value));
}