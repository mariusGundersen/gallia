import { globalObservationScope } from "../observable";
import { createElementFromHTML } from "../testUtils";
import handleAttributes from "./handleAttribute";

test("handleAttribute", () => {
  const element = createElementFromHTML(`<div @class="className"></div>`);
  const result = [...handleAttributes(element)];

  expect(result.length).toBe(1);

  result[0](element, { className: "value" }, globalObservationScope);
  expect(element.getAttribute("class")).toBe("value");
});
