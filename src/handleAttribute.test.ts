import handleAttributes from "./handleAttribute";
import { globalObservationScope } from "./observable";
import { createElementFromHTML } from "./testUtils";

test("handleAttribute", () => {
  const element = createElementFromHTML(`<div @class="className"></div>`);
  handleAttributes(element, { className: "value" }, globalObservationScope);
  expect(element.getAttribute("class")).toBe("value");
});
