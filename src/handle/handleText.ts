import { makeTextEvaluator } from "../utils.js";
import { HandleGenerator } from "./index.js";

export default function* handleText(element: Text, depth = 0): HandleGenerator {
  if (!element.textContent) return;

  try {
    const expression = makeTextEvaluator(element.textContent, depth);

    yield (node, { data, parents, scope }) =>
      scope.observeAndReact(
        () => expression(data, parents),
        (text) => (node.textContent = text)
      );
  } catch { }
}
