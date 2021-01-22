import { handleFor } from "./handleFor";
import { globalObservationScope } from "./observable";
import { createElementFromHTML } from "./testUtils";

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

    handleFor(
      parent.firstElementChild as HTMLTemplateElement,
      data,
      globalObservationScope,
      spy
    );

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

    handleFor(
      parent.firstElementChild as HTMLTemplateElement,
      data,
      globalObservationScope,
      spy
    );

    expect(parent.innerHTML).toMatchSnapshot();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1].list).toBe(data.list);
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

    handleFor(
      parent.firstElementChild as HTMLTemplateElement,
      data,
      globalObservationScope,
      spy
    );

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

    handleFor(
      parent.firstElementChild as HTMLTemplateElement,
      data,
      globalObservationScope
    );

    expect(parent.innerHTML).toMatchSnapshot();
  });
});
