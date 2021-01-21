export type Observer = () => void;

type Key = string | number | symbol;

type TargetPropTuple = [object, Key];

class Observed {
  listeners = new Set<Observer>();
  notify() {
    // Prevent infinite loop
    //
    // .values() returns an iterator
    // calling add() will replace the item already in the list
    // Therefore calling add(existingItem) while iterating will
    // result in an endless loop, as the exsitingItem is picked
    // up again.
    const listeners = Array.from(this.listeners.values());
    for (const listener of listeners) {
      listener();
    }
  }
  add(listener: Observer) {
    this.listeners.add(listener);
  }
  remove(listener: Observer) {
    this.listeners.delete(listener);
  }
}

// This is the global single current observer
// There can only be one observer at a time
let currentObserver: Observer | undefined;

// Here we store both the direct and reverse relationship between an observer and the observed
// observer -> object -> property
// object[propeprty] -> observer
// They are weakmaps so that we don't leak memory
const subscriptions = new WeakMap<object, Map<Key, Observed>>();

const reverseSubscriptions = new WeakMap<Observer, TargetPropTuple[]>();

function clearObserver(observer: Observer) {
  // We have a weakmap that stores the list of [target, prop] pairs that this observer is observing
  const oldProps = reverseSubscriptions.get(observer);

  if (oldProps) {
    while (oldProps.length > 0) {
      const [target, prop] = oldProps.pop() as TargetPropTuple;
      // remove the subscription that would notify this observer
      subscriptions.get(target)!.get(prop)!.remove(observer);
    }
  } else {
    reverseSubscriptions.set(observer, []);
  }
}

/**
 * Take an object and return an observable version of the object
 *
 * @param object The object we want to observe
 */
export function makeObservable<T extends object>(object: T): T {
  // All the properties on the object can be observed
  const listeners = new Map<Key, Observed>();

  const getOrCreate = (key: Key) => {
    const found = listeners.get(key);
    if(found) return found;

    const created = new Observed();
    listeners.set(key, created);
    return created;
  }

  const result = new Proxy(object, {
    get(target, prop, receiver) {
      if (currentObserver) {
        getOrCreate(prop).add(currentObserver);
        reverseSubscriptions.get(currentObserver)?.push([receiver, prop]);
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      getOrCreate(prop).notify();
      return result;
    },
    deleteProperty(target, prop){
      listeners.delete(prop);
      return Reflect.deleteProperty(target, prop);
    }
  });
  subscriptions.set(result, listeners);
  return result;
}

/**
 * Extend this class to become observable
 */
export class Observable{
  constructor(){
    return makeObservable(this);
  }
}

type Observe = typeof observe;
function observe<T>(observer: Observer, getter: () => T) {
  clearObserver(observer);
  currentObserver = observer;
  try {
    return getter();
  } finally {
    // finally ensures that it works ever with exceptions
    currentObserver = undefined;
  }
}

type Unobserve = typeof unobserve;
function unobserve(observer: Observer) {
  // Forget everything we know about this observer
  clearObserver(observer);
}


function createContext(observe: Observe, unobserve: Unobserve){
  return {
    observeAndReact<T>(
      getter: () => T,
      reaction: (value: T) => void) {
        const observer = () => reaction(observe(observer, getter));
        observer();
        return () => unobserve(observer);
    },
    createSubContext(){
      let observers = new Set<Observer>() as (Set<Observer> | null);

      return {
        subContext: createContext(
          (observer, effect) => {
            if(!observers) throw new Error("Attempted to observe a destroyed context");
            observers.add(observer);
            return observe(observer, effect);
          },
          (observer) => {
            if(!observers) throw new Error("Attempted to unobserve a destroyed context");
            observers.delete(observer);
            unobserve(observer)
          }
        ),
        destroySubContext(){
          if(!observers) throw new Error("Attempted to destory an already destoryed context");
          for(const observer of observers){
            unobserve(observer);
          }
          observers = null;
        }
      }
    }
  }
}

const rootContext = createContext(observe, unobserve);

export { rootContext as context };

export type Context = typeof rootContext;
