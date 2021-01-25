import {
  globalObservationScope,
  makeObservable,
  Observable,
} from "./observable";

class DataTest extends Observable {
  visible = false;
}

test("Observable object", () => {
  const data = makeObservable({
    visible: false,
  });

  const spy = jest.fn();

  globalObservationScope.observeAndReact(() => data.visible, spy);

  expect(spy).toHaveBeenCalledWith(false);

  data.visible = true;

  expect(spy).toHaveBeenCalledWith(true);
});

test("Observable array", () => {
  const data = makeObservable([1]);

  const spy = jest.fn();

  globalObservationScope.observeAndReact(() => data[0], spy);

  expect(spy).toHaveBeenCalledWith(1);

  data[0] = 5;

  expect(spy).toHaveBeenCalledWith(5);
});

test("Observable object getting", () => {
  const data = makeObservable({
    visible: false,
  });

  data.visible = true;

  expect(data.visible).toBe(true);
});

test("Observable subclass", () => {
  const data = new DataTest();

  const spy = jest.fn();

  globalObservationScope.observeAndReact(() => data.visible, spy);

  expect(spy).toHaveBeenCalledWith(false);

  data.visible = true;

  expect(spy).toHaveBeenCalledWith(true);
});

test("Observable subclass new property", () => {
  const data = new DataTest() as DataTest & { something: boolean };

  const spy = jest.fn();

  globalObservationScope.observeAndReact(() => data.something, spy);

  data.something = true;

  expect(spy).toHaveBeenCalledWith(true);
});

test("Unobserve", () => {
  const data = new DataTest();

  const spy = jest.fn();

  const unobserve = globalObservationScope.observeAndReact(
    () => data.visible,
    spy
  );

  expect(spy).toHaveBeenCalledWith(false);

  data.visible = true;

  expect(spy).toHaveBeenCalledWith(true);

  spy.mockClear();

  unobserve();

  data.visible = false;

  expect(spy).not.toHaveBeenCalled();
});

describe("Scopes", () => {
  test("create, use and destroy", () => {
    const data = new DataTest();

    const spy = jest.fn();

    const { scope, destroy } = globalObservationScope.createSubScope();

    scope.observeAndReact(() => data.visible, spy);

    expect(spy).toHaveBeenCalledWith(false);

    data.visible = true;

    expect(spy).toHaveBeenCalledWith(true);

    destroy();

    spy.mockClear();

    data.visible = false;

    expect(spy).not.toHaveBeenCalled();
  });

  test("unobserve scope", () => {
    const data = new DataTest();

    const spy = jest.fn();

    const unobserve = globalObservationScope
      .createSubScope()
      .scope.observeAndReact(() => data.visible, spy);

    expect(spy).toHaveBeenCalledWith(false);

    data.visible = true;

    expect(spy).toHaveBeenCalledWith(true);

    unobserve();

    spy.mockClear();

    data.visible = false;

    expect(spy).not.toHaveBeenCalled();
  });

  test("observe destroyed scope", () => {
    const data = new DataTest();

    const spy = jest.fn();

    const { scope, destroy } = globalObservationScope.createSubScope();

    destroy();

    expect(() => scope.observeAndReact(() => data.visible, spy)).toThrowError();
  });

  test("unobserve destroyed scope", () => {
    const data = new DataTest();

    const spy = jest.fn();

    const { scope, destroy } = globalObservationScope.createSubScope();

    const unobserve = scope.observeAndReact(() => data.visible, spy);

    destroy();

    expect(() => unobserve()).toThrowError();
  });

  test("destroy already destroyed scope", () => {
    const { destroy } = globalObservationScope.createSubScope();

    destroy();

    expect(() => destroy()).toThrowError();
  });

  test("destroy already destroyed sub-scope", () => {
    const { scope, destroy } = globalObservationScope.createSubScope();

    const { destroy: destroySubScope } = scope.createSubScope();

    destroy();

    expect(() => destroySubScope()).toThrowError();
  });

  test("destroy scope with destroyed sub-scope", () => {
    const { scope, destroy } = globalObservationScope.createSubScope();

    const { destroy: destroySubScope } = scope.createSubScope();

    destroySubScope();

    expect(() => destroy()).not.toThrowError();
  });

  test("onDestroy", () => {
    const { scope, destroy } = globalObservationScope.createSubScope();

    const spy = jest.fn();

    scope.onDestroy(spy);

    destroy();

    expect(spy).toHaveBeenCalled();
  });

  test("onDestroy in sub-scope", () => {
    const { scope, destroy } = globalObservationScope.createSubScope();

    const { scope: subScope } = scope.createSubScope();

    const spy = jest.fn();

    subScope.onDestroy(spy);

    destroy();

    expect(spy).toHaveBeenCalled();
  });

  test("onDestroy in parent-scope", () => {
    const { scope } = globalObservationScope.createSubScope();

    const { scope: subScope, destroy } = scope.createSubScope();

    const spy = jest.fn();

    scope.onDestroy(spy);

    destroy();

    expect(spy).not.toHaveBeenCalled();
  });
});
