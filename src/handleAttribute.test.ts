import handleAttributes from "./handleAttribute";
import { context } from "./observable";
import { createElementFromHTML } from "./testUtils";

test('handleAttribute', () => {
  const element = createElementFromHTML(`<div @class="className"></div>`);
  handleAttributes(element, {className: 'value'}, context);
  expect(element.getAttribute('class')).toBe('value');
});

