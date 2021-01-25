import { globalObservationScope } from "../observable.js";
import handle from "./index.js";

test("when handler is called with a text node it should return one result", () => {
  const node = document.createTextNode("something");

  const result = [...handle(node)];

  expect(result.length).toBe(1);
});

test("when handler is called it should update the text", () => {
  const node = document.createTextNode("hello ${what}");

  const [result] = [...handle(node)];

  expect(node.textContent).toBe("hello ${what}");

  result(node, { what: "world" }, globalObservationScope);

  expect(node.textContent).toBe("hello world");
});

test("when handler is called with another text node it should update that text too", () => {
  const node = document.createTextNode("hello ${what}");

  const [result] = [...handle(node)];

  const anotherNode = document.createTextNode("hello ${what}");

  expect(anotherNode.textContent).toBe("hello ${what}");

  result(anotherNode, { what: "world" }, globalObservationScope);

  expect(anotherNode.textContent).toBe("hello world");
});

test("when handler is called with a node tree it should update the correct node", () => {
  const node = document.createTextNode("hello ${what}");

  const parent = document.createElement("div");
  parent.appendChild(node);

  const [result] = [...handle(parent)];

  expect(node.textContent).toBe("hello ${what}");

  result(parent, { what: "world" }, globalObservationScope);

  expect(node.textContent).toBe("hello world");
});
