import { Context } from './observable';
import { makeTextEvaluator } from './utils';

export default function handleText(element: Node, data: unknown, context: Context) {
  if(!element.textContent) return;
  try { 
    const expression = makeTextEvaluator(element.textContent);
    context.observeAndReact(
      () => expression(data), 
      text => element.textContent = text
    );
  }catch {}
}
