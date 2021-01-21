import { Context } from "./observable";
import { makeEventHandler, makeExpressionEvaluator } from "./utils";

export default function handleProperties(element: Element, data: unknown, context: Context){
  Array
    .from(element.attributes)
    .filter(a => a.name.startsWith('.'))
    .forEach(a => handleProperty(a, data, context));
}

export function handleProperty(attr: Attr, data: unknown, context: Context) {
  const element = attr.ownerElement as Element;
  const property = attr.name.substr(1);
  if(property.startsWith('on-')){
    const eventHandler = makeEventHandler(attr.value);
    element.addEventListener(property.substr(3), e => eventHandler(data, e));
  }else{
    const expression = makeExpressionEvaluator(attr.value);
    context.observeAndReact(() => expression(data), value => (element as any)[property] = value);
  }
}