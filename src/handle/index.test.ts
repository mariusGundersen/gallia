import { globalObservationScope as scope } from "../observable.js";
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

  result(node, { data: { what: "world" }, parents: [], scope });

  expect(node.textContent).toBe("hello world");
});

test("when handler is called with data in parent it should update the text", () => {
  const node = document.createTextNode("${greeting} ${what}");

  const [result] = [...handle(node, 1)];

  expect(node.textContent).toBe("${greeting} ${what}");

  result(node, { data: { what: "world" }, parents: [{ greeting: "hello" }], scope });

  expect(node.textContent).toBe("hello world");
});

test("when handler is called with another text node it should update that text too", () => {
  const node = document.createTextNode("hello ${what}");

  const [result] = [...handle(node)];

  const anotherNode = document.createTextNode("hello ${what}");

  expect(anotherNode.textContent).toBe("hello ${what}");

  result(anotherNode, { data: { what: "world" }, parents: [], scope });

  expect(anotherNode.textContent).toBe("hello world");
});

test("when handler is called with a node tree it should update the correct node", () => {
  const node = document.createTextNode("hello ${what}");

  const parent = document.createElement("div");
  parent.appendChild(node);

  const [result] = [...handle(parent)];

  expect(node.textContent).toBe("hello ${what}");

  result(parent, { data: { what: "world" }, parents: [], scope });

  expect(node.textContent).toBe("hello world");
});
