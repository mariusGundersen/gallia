import {
  globalObservationScope,
  makeObservable,
  ObservableObject,
  ObservationScope,
} from "../observable";
import { createElementFromHTML } from "../testUtils";
import { handleIf } from "./handleIf";
import { HandleGenerator } from "./index";

describe("if", () => {
  test.each([true, false])("if %s", (visible) => {
    const parent = createElementFromHTML(`
      <div>
        <template x-if="visible">
          Something
        </template>
      </div>
    `);

    const data = {
      visible,
    };

    const [result] = [
      ...handleIf(
        parent.firstElementChild as HTMLTemplateElement,
        emptyGenerator
      ),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    expect(parent.innerHTML).toMatchSnapshot();
  });

  test("if true then walk should be called with data", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-if="visible">
          Something
        </template>
      </div>
    `);

    const data = makeObservable({
      visible: true,
    });

    const spy = jest.fn();
    const handlerSpy = jest.fn(function* () {
      yield (node: Node, data: ObservableObject, scope: ObservationScope) =>
        spy(node.childNodes[0], data, scope);
    });

    const [result] = [
      ...handleIf(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    expect(handlerSpy).toHaveBeenCalled();

    result(parent.firstElementChild as Node, data, globalObservationScope);

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe(
      parent.firstChild?.nextSibling?.nextSibling
    );
    expect(spy.mock.calls[0][1]).toBe(data);
  });

  test("if false then true", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-if="visible">
          Something
        </template>
      </div>
    `);

    const data = makeObservable({
      visible: false,
    });

    const [result] = [
      ...handleIf(
        parent.firstElementChild as HTMLTemplateElement,
        emptyGenerator
      ),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    data.visible = true;

    expect(parent.innerHTML).toMatchSnapshot();
  });

  test("if true then false then true", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-if="visible">
          Something
        </template>
      </div>
    `);

    const data = makeObservable({
      visible: true,
    });

    const spy = jest.fn();
    const handlerSpy = jest.fn(function* () {
      yield spy;
    });

    const [result] = [
      ...handleIf(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    data.visible = false;
    data.visible = true;

    expect(spy).toHaveBeenCalledTimes(2);
  });

  test("if true then false scope should be destroyed", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-if="visible">
          Something
        </template>
      </div>
    `);

    const data = makeObservable({
      visible: true,
    });

    const spy = jest.fn();

    const [result] = [
      ...handleIf(
        parent.firstElementChild as HTMLTemplateElement,
        function* () {
          yield (_node, _data, scope) => scope.onDestroy(spy);
        }
      ),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    data.visible = false;

    expect(spy).toHaveBeenCalled();
  });
});

function* emptyGenerator(node: Node, depth: number): HandleGenerator {}
