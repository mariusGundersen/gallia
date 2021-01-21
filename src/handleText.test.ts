import handleText from "./handleText";
import { context, makeObservable } from "./observable";

test('handleText basic', () => {
  const element = document.createTextNode('some text');
  handleText(element, {}, context);
  expect(element.textContent).toBe('some text');
});

test('handleText interpolation', () => {
  const element = document.createTextNode('some ${value}');
  handleText(element, {value: 'text'}, context);
  expect(element.textContent).toBe('some text');
});

test('handleText interpolation changes', () => {
  const element = document.createTextNode('some ${value}');
  const data = makeObservable({value: 'text'});
  handleText(element, data, context);
  expect(element.textContent).toBe('some text');
  data.value = 'test';
  expect(element.textContent).toBe('some test');
});