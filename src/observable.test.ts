import { context, makeObservable, Observable } from './observable';

class DataTest extends Observable {
  visible = false
}

test('Observable object', () => {
  const data = makeObservable({
    visible: false
  });

  const spy = jest.fn();

  context.observeAndReact(() => data.visible, spy);

  expect(spy).toHaveBeenCalledWith(false);

  data.visible = true;

  expect(spy).toHaveBeenCalledWith(true);
});

test('Observable object getting', () => {
  const data = makeObservable({
    visible: false
  });

  data.visible = true;

  expect(data.visible).toBe(true);
});

test('Observable subclass', () => {
  const data = new DataTest();

  const spy = jest.fn();

  context.observeAndReact(() => data.visible, spy);

  expect(spy).toHaveBeenCalledWith(false);

  data.visible = true;

  expect(spy).toHaveBeenCalledWith(true);
});

test('Observable subclass new property', () => {
  const data = new DataTest() as DataTest & {something: boolean};

  const spy = jest.fn();

  context.observeAndReact(() => data.something, spy);

  data.something = true;

  expect(spy).toHaveBeenCalledWith(true);
});

test('Unobserve', () => {
  const data = new DataTest();

  const spy = jest.fn();

  const unobserve = context.observeAndReact(() => data.visible, spy);

  expect(spy).toHaveBeenCalledWith(false);

  data.visible = true;

  expect(spy).toHaveBeenCalledWith(true);

  spy.mockClear();

  unobserve();

  data.visible = false;

  expect(spy).not.toHaveBeenCalled();
});

describe("SubContext", () => {

  test('create, use and destroy', () => {
    const data = new DataTest();

    const spy = jest.fn();

    const { subContext, destroySubContext } = context.createSubContext();

    subContext.observeAndReact(() => data.visible, spy);

    expect(spy).toHaveBeenCalledWith(false);

    data.visible = true;

    expect(spy).toHaveBeenCalledWith(true);

    destroySubContext();

    spy.mockClear();

    data.visible = false;

    expect(spy).not.toHaveBeenCalled();
  });

  test('unobserve subcontext', () => {
    const data = new DataTest();

    const spy = jest.fn();

    const unobserve = context.createSubContext().subContext.observeAndReact(() => data.visible, spy);

    expect(spy).toHaveBeenCalledWith(false);

    data.visible = true;

    expect(spy).toHaveBeenCalledWith(true);

    unobserve();

    spy.mockClear();

    data.visible = false;

    expect(spy).not.toHaveBeenCalled();
  });

  test('observe destroyed subContext', () => {
    const data = new DataTest();

    const spy = jest.fn();

    const { subContext, destroySubContext } = context.createSubContext();

    destroySubContext();

    expect(() => subContext.observeAndReact(() => data.visible, spy)).toThrowError();
  });

  test('unobserve destroyed subContext', () => {
    const data = new DataTest();

    const spy = jest.fn();

    const { subContext, destroySubContext } = context.createSubContext();

    const unobserve =  subContext.observeAndReact(() => data.visible, spy);

    destroySubContext();

    expect(() => unobserve()).toThrowError();
  });

  test('destroy already destroyed subContext', () => {
    const data = new DataTest();

    const spy = jest.fn();

    const { subContext, destroySubContext } = context.createSubContext();

    const unobserve =  subContext.observeAndReact(() => data.visible, spy);

    destroySubContext();

    expect(() => destroySubContext()).toThrowError();
  });
});