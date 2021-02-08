import {
  globalObservationScope as scope,
  makeObservable
} from "../observable";
import { createElementFromHTML } from "../testUtils";
import { handleFor } from "./handleFor";
import { HandlerContext } from "./index";

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
    const handlerSpy = jest.fn(function () {
      return spy;
    });

    const [result] = [
      ...handleFor(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

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
    const handlerSpy = jest.fn(function () {
      return (node: Node, context: HandlerContext) =>
        spy(node.childNodes[0], context);
    });

    const [result] = [
      ...handleFor(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

    expect(parent.innerHTML).toMatchSnapshot();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe(
      parent.firstChild?.nextSibling?.nextSibling
    );
    expect(spy.mock.calls[0][1].parents[0].list).toBe(data.list);
    expect(spy.mock.calls[0][1].data.item).toBe(1);
    expect(spy.mock.calls[0][1].data.$index).toBe(0);
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
    const handlerSpy = jest.fn(function () {
      return spy;
    });

    const [result] = [
      ...handleFor(parent.firstElementChild as HTMLTemplateElement, handlerSpy),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

    expect(parent.innerHTML).toMatchSnapshot();

    expect(spy).toHaveBeenCalledTimes(5);
  });

  test.skip("iterator with five items", () => {
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
        createEmptyWalker
      ),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });
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
        createEmptyWalker
      ),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

    expect(parent.innerHTML).toMatchSnapshot();

    data.list = [1, 2];

    expect(parent.innerHTML).toMatchSnapshot();
  });

  test.skip("appending items", () => {
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
        createEmptyWalker
      ),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

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
        createEmptyWalker
      ),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

    expect(parent.innerHTML).toMatchSnapshot();

    data.list = [{ key: 2 }, { key: 1 }];

    expect(parent.innerHTML).toMatchSnapshot();
  });

  test("remove item at end", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-for="item of list" x-key="item.key">
          Something
        </template>
      </div>
    `);

    const data = makeObservable({
      list: [{ key: 1 }, { key: 2 }, { key: 3 }],
    });

    const [result] = [
      ...handleFor(
        parent.firstElementChild as HTMLTemplateElement,
        createEmptyWalker
      ),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

    expect(parent.innerHTML).toMatchSnapshot();

    data.list = [{ key: 1 }, { key: 2 }];

    expect(parent.innerHTML).toMatchSnapshot();
  });

  test("remove item at beginning", () => {
    const parent = createElementFromHTML(`
      <div>
        <template x-for="item of list" x-key="item.key">
          Something
        </template>
      </div>
    `);

    const data = makeObservable({
      list: [{ key: 1 }, { key: 2 }, { key: 3 }],
    });

    const [result] = [
      ...handleFor(
        parent.firstElementChild as HTMLTemplateElement,
        createEmptyWalker
      ),
    ];

    result(parent.firstElementChild as Node, { data, parents: [], scope });

    expect(parent.innerHTML).toMatchSnapshot();

    data.list = [{ key: 2 }, { key: 3 }];

    expect(parent.innerHTML).toMatchSnapshot();
  });
});

function createEmptyWalker(node: Node) {
  return () => { };
}
