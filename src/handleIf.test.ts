import { handleIf } from "./handleIf";
import { context, makeObservable } from "./observable";

test('if false', () => {
  const parent = document.createElement('div');
  const template = document.createElement('template');
  template.innerHTML = 'Something';
  template.setAttribute('x-if', 'visible');
  parent.appendChild(template);
  const data = makeObservable({
    visible: false
  });
  handleIf(template, data, context);
  expect(parent.firstChild?.nodeName).toBe('#comment');
  expect(parent.firstChild?.textContent).toBe('if (visible) {');
  expect(parent.lastChild?.nodeName).toBe('#comment');
  expect(parent.lastChild?.textContent).toBe('}');
  expect(parent.childNodes.length).toBe(2);
  expect(parent.textContent).toBe('');
});

test('if true', () => {
  const parent = document.createElement('div');
  const template = document.createElement('template');
  template.innerHTML = 'Something';
  template.setAttribute('x-if', 'visible');
  parent.appendChild(template);
  const data = makeObservable({
    visible: true
  });
  handleIf(template, data, context);
  expect(parent.firstChild?.nodeName).toBe('#comment');
  expect(parent.firstChild?.textContent).toBe('if (visible) {');
  expect(parent.lastChild?.nodeName).toBe('#comment');
  expect(parent.lastChild?.textContent).toBe('}');
  expect(parent.childNodes.length).toBe(3);
  expect(parent.textContent).toBe('Something');
});