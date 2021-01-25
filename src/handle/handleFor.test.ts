import {
  globalObservationScope,
  makeObservable,
  ObservableObject,
  ObservationScope,
} from "../observable";
import { createElementFromHTML } from "../testUtils";
import { handleFor } from "./handleFor";
import { HandleGenerator } from "./index";

describe("for", () => {
  test("empty list", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-for="item of list">
          Something
        </template>
      </div>
    `);

    const data = {
      list: [],
    };

    const spy = jest.fn();
    const handlerSpy = jest.fn(function* () {
      yield spy;
    });

    const [result] = [
      ...handleFor(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    expect(parent.innerHTML).toMatchSnapshot();

    expect(spy).not.toHaveBeenCalled();
  });

  test("one item", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-for="item of list">
          Something
        </template>
      </div>
    `);

    const data = {
      list: [1],
    };

    const spy = jest.fn();
    const handlerSpy = jest.fn(function* () {
      yield (node: Node, data: ObservableObject, scope: ObservationScope) =>
        spy(node.childNodes[0], data, scope);
    });

    const [result] = [
      ...handleFor(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    expect(parent.innerHTML).toMatchSnapshot();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe(
      parent.firstChild?.nextSibling?.nextSibling
    );
    expect(spy.mock.calls[0][1].$parent.list).toBe(data.list);
    expect(spy.mock.calls[0][1].item).toBe(1);
    expect(spy.mock.calls[0][1].$index).toBe(0);
  });

  test("five items", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-for="item of list">
          Something
        </template>
      </div>
    `);

    const data = {
      list: [1, 2, 3, 4, 5],
    };

    const spy = jest.fn();
    const handlerSpy = jest.fn(function* () {
      yield spy;
    });

    const [result] = [
      ...handleFor(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    expect(parent.innerHTML).toMatchSnapshot();

    expect(spy).toHaveBeenCalledTimes(5);
  });

  test("iterator with five items", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-for="item of list()">
          Something
        </template>
      </div>
    `);

    const data = {
      *list() {
        for (let i = 0; i < 5; i++) {
          yield i;
        }
      },
    };

    const [result] = [
      ...handleFor(
        parent.firstElementChild as HTMLTemplateElement,
        emptyGenerator
      ),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);
    expect(parent.innerHTML).toMatchSnapshot();
  });

  test("replacing items", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-for="item of list">
          Something
        </template>
      </div>
    `);

    const data = makeObservable({
      list: [1],
    });

    const [result] = [
      ...handleFor(
        parent.firstElementChild as HTMLTemplateElement,
        emptyGenerator
      ),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    expect(parent.innerHTML).toMatchSnapshot();

    data.list = [1, 2];

    expect(parent.innerHTML).toMatchSnapshot();
  });

  test("appending items", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-for="item of list">
          Something
        </template>
      </div>
    `);

    const data = {
      list: makeObservable([1]),
    };

    const [result] = [
      ...handleFor(
        parent.firstElementChild as HTMLTemplateElement,
        emptyGenerator
      ),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    expect(parent.innerHTML).toMatchSnapshot();

    data.list.push(2);

    expect(parent.innerHTML).toMatchSnapshot();
  });

  test("move item", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-for="item of list" x-key="item.key">
          Something
        </template>
      </div>
    `);

    const data = makeObservable({
      list: [{ key: 1 }, { key: 2 }],
    });

    const [result] = [
      ...handleFor(
        parent.firstElementChild as HTMLTemplateElement,
        emptyGenerator
      ),
    ];

    result(parent.firstElementChild as Node, data, globalObservationScope);

    expect(parent.innerHTML).toMatchSnapshot();

    data.list = [{ key: 2 }, { key: 1 }];

    expect(parent.innerHTML).toMatchSnapshot();
  });
});

function* emptyGenerator(node: Node, depth: number): HandleGenerator {}
