import { handleIf } from "./handleIf";
import { globalObservationScope, makeObservable } from "./observable";
import { createElementFromHTML } from "./testUtils";

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

    handleIf(
      parent.firstElementChild as HTMLTemplateElement,
      data,
      globalObservationScope
    );

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

    handleIf(
      parent.firstElementChild as HTMLTemplateElement,
      data,
      globalObservationScope,
      spy
    );

    expect(spy).toHaveBeenCalled();

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

    const spy = jest.fn();

    handleIf(
      parent.firstElementChild as HTMLTemplateElement,
      data,
      globalObservationScope,
      spy
    );

    data.visible = true;

    expect(parent.innerHTML).toMatchSnapshot();
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

    handleIf(
      parent.firstElementChild as HTMLTemplateElement,
      data,
      globalObservationScope,
      (_n, _d, scope) => scope.onDestroy(spy)
    );

    data.visible = false;

    expect(spy).toHaveBeenCalled();
  });
});
