import {
  globalObservationScope as scope,
  makeObservable
} from "../observable";
import { createElementFromHTML } from "../testUtils";
import { handleIf } from "./handleIf";
import { HandlerContext } from "./index";

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
        createEmptyWalker
      ),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

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
    const handlerSpy = jest.fn(function () {
      return (node: Node, context: HandlerContext) =>
        spy(node.childNodes[0], context);
    });

    const [result] = [
      ...handleIf(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    expect(handlerSpy).toHaveBeenCalled();

    result(parent.firstElementChild as Node, { data, parents: [], scope });

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe(
      parent.firstChild?.nextSibling?.nextSibling
    );
    expect(spy.mock.calls[0][1].data).toBe(data);
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
        createEmptyWalker
      ),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

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
    const handlerSpy = jest.fn(function () {
      return spy;
    });

    const [result] = [
      ...handleIf(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

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
      ...handleIf(parent.firstElementChild as HTMLTemplateElement, function () {
        return (_, { scope }) => scope.onDestroy(spy);
      }),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

    data.visible = false;

    expect(spy).toHaveBeenCalled();
  });
});

function createEmptyWalker(node: Node) {
  return () => { };
}
