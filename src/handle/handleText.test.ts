import { globalObservationScope, makeObservable } from "../observable";
import handleText from "./handleText";

test("handleText with normal content", () => {
  const element = document.createTextNode("some text");
  const results = [...handleText(element)];

  expect(results.length).toBe(1);

  results[0](element, {}, globalObservationScope);

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

  handler(element, {}, globalObservationScope);

  expect(element.textContent).toBe("some text");
});

test("handleText interpolation", () => {
  const element = document.createTextNode("some ${value}");
  const [handler] = [...handleText(element)];

  handler(element, { value: "text" }, globalObservationScope);

  expect(element.textContent).toBe("some text");
});

test("handleText interpolation changes", () => {
  const element = document.createTextNode("some ${value}");
  const data = makeObservable({ value: "text" });
  const [handler] = [...handleText(element)];

  handler(element, data, globalObservationScope);

  expect(element.textContent).toBe("some text");
  data.value = "test";
  expect(element.textContent).toBe("some test");
});
