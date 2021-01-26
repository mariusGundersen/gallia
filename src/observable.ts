export interface Observer {
  notify(): void;
  targets: TargetPropTuple[];
}
type Listener = () => void;

export type ObservableObject = Record<string, unknown> | any[];

type Key = string | number | symbol;

type TargetPropTuple = [ObservableObject, Key];

class Observed {
  observers = new Set<Observer>();
  notify() {
    // Prevent infinite loop
    //
    // .values() returns an iterator
    // calling add() will replace the item already in the list
    // Therefore calling add(existingItem) while iterating will
    // result in an endless loop, as the exsitingItem is picked
    // up again.
    const observers = Array.from(this.observers.values());
    for (let i = 0; i < observers.length; i++) {
      observers[i].notify();
    }
  }
  add(listener: Observer) {
    this.observers.add(listener);
  }
  remove(listener: Observer) {
    this.observers.delete(listener);
  }
}

// This is the global single current observer
// There can only be one observer at a time
let currentObserver: Observer | undefined;

// Here we store both the direct and reverse relationship between an observer and the observed
// observer -> object -> property
// object[propeprty] -> observer
// They are weakmaps so that we don't leak memory
const subscriptions = new WeakMap<ObservableObject, Map<Key, Observed>>();

function clearObserver(observer: Observer) {
  while (observer.targets.length > 0) {
    const [target, prop] = observer.targets.pop() as TargetPropTuple;
    // remove the subscription that would notify this observer
    subscriptions.get(target)?.get(prop)?.remove(observer);
  }
}

/**
 * Take an object and return an observable version of the object
 *
 * @param object The object we want to observe
 */
export function makeObservable<T extends ObservableObject>(object: T): T {
  // prevent an already observable object being made observable again
  if (subscriptions.has(object)) return object;

  // All the properties on the object can be observed
  const listeners = new Map<Key, Observed>();

  const getOrCreate = (key: Key) => {
    const found = listeners.get(key);
    if (found) return found;

    const created = new Observed();
    listeners.set(key, created);
    return created;
  };

  const result = new Proxy(object, {
    get(target, prop, receiver) {
      if (currentObserver && prop !== Symbol.unscopables) {
        getOrCreate(prop).add(currentObserver);
        currentObserver.targets.push([receiver, prop]);
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      if (prop !== Symbol.unscopables) {
        getOrCreate(prop).notify();
      }
      return result;
    },
    deleteProperty(target, prop) {
      listeners.delete(prop);
      return Reflect.deleteProperty(target, prop);
    },
  });
  subscriptions.set(result, listeners);
  return result;
}

/**
 * Extend this class to become observable
 */
export class Observable {
  constructor() {
    return makeObservable(this as ObservableObject);
  }
}

function observe<T>(observer: Observer, getter: () => T) {
  clearObserver(observer);
  currentObserver = observer;
  try {
    return getter();
  } finally {
    // finally ensures that it works even with exceptions
    currentObserver = undefined;
  }
}

function unobserve(observer: Observer) {
  // Forget everything we know about this observer
  clearObserver(observer);
}

interface Destroyable {
  addDestroyListener(listener: Listener): void;
  removeDestroyListener(listener: Listener): void;
}

interface Context extends Destroyable {
  observe<T>(observer: Observer, getter: () => T): T;
  unobserve(observer: Observer): void;
}

const rootContext: Context = {
  observe,
  unobserve,
  addDestroyListener() {},
  removeDestroyListener() {},
};

export interface ObservationScope {
  observeAndReact<T>(getter: () => T, reaction: (value: T) => void): () => void;
  onDestroy(listener: Listener): void;
  createSubScope(): { scope: ObservationScope; destroy(): void };
}

function createObservationScope(context: Context): ObservationScope {
  return {
    observeAndReact<T>(getter: () => T, reaction: (value: T) => void) {
      const observer: Observer = {
        notify() {
          reaction(context.observe(observer, getter));
        },
        targets: [],
      };

      observer.notify();

      // if there is nothing that can notify this observer then it's not needed
      // unobserve removes it from the list in the context
      if (observer.targets.length === 0) {
        context.unobserve(observer);
        return noop;
      }

      return () => context.unobserve(observer);
    },
    onDestroy(listener: Listener) {
      context.addDestroyListener(listener);
    },
    createSubScope() {
      const [destroy, subContext] = createSubContext(context);
      return {
        scope: createObservationScope(subContext),
        destroy,
      };
    },
  };
}

const globalObservationScope = createObservationScope(rootContext);

export { globalObservationScope };

function noop() {}

function createSubContext({
  addDestroyListener,
  removeDestroyListener,
}: Destroyable): [() => void, Context] {
  let observers: Set<Observer> | null = new Set<Observer>();
  const destroyListeners = new Set<Listener>();

  function destroy() {
    if (!observers)
      throw new Error("Attempted to destory an already destroyed scope");

    removeDestroyListener(destroy);

    for (const observer of observers) {
      unobserve(observer);
    }

    for (const destroyListener of destroyListeners) {
      destroyListener();
    }

    observers = null;
  }

  addDestroyListener(destroy);

  const subContext: Context = {
    observe<T>(observer: Observer, effect: () => T) {
      if (!observers) throw new Error("Attempted to observe a destroyed scope");

      observers.add(observer);
      return observe(observer, effect);
    },
    unobserve(observer: Observer) {
      if (!observers)
        throw new Error("Attempted to unobserve a destroyed scope");

      observers.delete(observer);
      unobserve(observer);
    },
    addDestroyListener(listener: Listener) {
      destroyListeners.add(listener);
    },
    removeDestroyListener(listener: Listener) {
      destroyListeners.delete(listener);
    },
  };

  return [destroy, subContext];
}
