import { globalObservationScope as scope, makeObservable } from "../observable";
import handleText from "./handleText";

test("handleText with normal content", () => {
  const element = document.createTextNode("some text");
  const results = [...handleText(element)];

  expect(results.length).toBe(1);

  results[0](element, { data: {}, parents: [], scope });

  expect(element.textContent).toBe("some text");
});

test("handleText without content", () => {
  const element = document.createTextNode("");
  const results = [...handleText(element)];

  expect(results.length).toBe(0);
});

test("handleText with syntax error", () => {
  const element = document.createTextNode("it costs ${");
  const results = [...handleText(element)];

  expect(results.length).toBe(0);
});

test("handleText basic", () => {
  const element = document.createTextNode("some text");
  const [handler] = [...handleText(element)];

  handler(element, { data: {}, parents: [], scope });

  expect(element.textContent).toBe("some text");
});

test("handleText interpolation", () => {
  const element = document.createTextNode("some ${value}");
  const [handler] = [...handleText(element)];

  handler(element, { data: { value: "text" }, parents: [], scope });

  expect(element.textContent).toBe("some text");
});

test("handleText interpolation changes", () => {
  const element = document.createTextNode("some ${value}");
  const data = makeObservable({ value: "text" });
  const [handler] = [...handleText(element)];

  handler(element, { data, parents: [], scope });

  expect(element.textContent).toBe("some text");
  data.value = "test";
  expect(element.textContent).toBe("some test");
});

test("handleText works with $parent context", () => {
  const element = document.createTextNode("${greeting} ${value}");
  const data = makeObservable({ value: "text" });
  const [handler] = [...handleText(element, 1)];

  handler(element, { data, parents: [{ greeting: "some" }], scope });

  expect(element.textContent).toBe("some text");
  data.value = "test";
  expect(element.textContent).toBe("some test");
});

test("handleText works with $parent context", () => {
  const element = document.createTextNode("${$parent.value} ${value}");
  const data = makeObservable({ value: "text" });
  const [handler] = [...handleText(element, 1)];

  handler(element, { data, parents: [{ value: "some" }], scope });

  expect(element.textContent).toBe("some text");
  data.value = "test";
  expect(element.textContent).toBe("some test");
});

test("handleText works with parent context that changes", () => {
  const element = document.createTextNode("${greeting} ${value}");
  const data = makeObservable({ value: "text" });
  const parent = makeObservable({ greeting: "some" });
  const [handler] = [...handleText(element, 1)];

  handler(element, { data, parents: [parent], scope });

  expect(element.textContent).toBe("some text");
  parent.greeting = "any";
  expect(element.textContent).toBe("any text");
});

test("handleText works with $parent context that changes", () => {
  const element = document.createTextNode("${$parent.value} ${value}");
  const data = makeObservable({ value: "text" });
  const parent = makeObservable({ value: "some" });
  const [handler] = [...handleText(element, 1)];

  handler(element, { data, parents: [parent], scope });

  expect(element.textContent).toBe("some text");
  parent.value = "any";
  expect(element.textContent).toBe("any text");
});
