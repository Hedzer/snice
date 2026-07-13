type MutationCallback = () => void;

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function descriptorsEqual(first?: PropertyDescriptor, second?: PropertyDescriptor): boolean {
  if (!first || !second) return first === second;
  const firstIsData = 'value' in first || 'writable' in first;
  const secondIsData = 'value' in second || 'writable' in second;
  return firstIsData === secondIsData &&
    first.configurable === second.configurable &&
    first.enumerable === second.enumerable &&
    (!firstIsData || (
      first.writable === second.writable &&
      Object.is(first.value, second.value)
    )) &&
    (firstIsData || (
      first.get === second.get &&
      first.set === second.set
    ));
}

function invariantValue(target: object, property: PropertyKey): { locked: boolean; value: unknown } {
  const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
  if (!descriptor || descriptor.configurable) return { locked: false, value: undefined };
  if ('value' in descriptor && descriptor.writable === false) {
    return { locked: true, value: descriptor.value };
  }
  if (!('value' in descriptor) && descriptor.get === undefined) {
    return { locked: true, value: undefined };
  }
  return { locked: false, value: undefined };
}

/**
 * Wrap mutable collection/object state so nested writes can invalidate a
 * component without requiring a replacement assignment.
 */
export function createDeepReactive<T>(value: T, changed: MutationCallback): T {
  if (!value || typeof value !== 'object') return value;

  const cache = new WeakMap<object, any>();
  const rawByProxy = new WeakMap<object, object>();
  const unwrap = (input: any): any => input && typeof input === 'object'
    ? rawByProxy.get(input) || input
    : input;

  const wrap = (input: any): any => {
    if (!input || typeof input !== 'object') return input;
    if (cache.has(input)) return cache.get(input);

    if (input instanceof Map) {
      let proxy: Map<any, any>;
      const methods = new Map<PropertyKey, unknown>();
      proxy = new Proxy(input, {
        get(target, property) {
          const invariant = invariantValue(target, property);
          if (invariant.locked) return invariant.value;
          if (methods.has(property)) return methods.get(property);
          let method: unknown;
          if (property === 'set') method = (key: unknown, next: unknown) => {
            key = unwrap(key);
            next = unwrap(next);
            const existed = target.has(key);
            const previous = target.get(key);
            target.set(key, next);
            if (!existed || !Object.is(previous, next)) changed();
            return proxy;
          };
          else if (property === 'delete') method = (key: unknown) => {
            key = unwrap(key);
            const deleted = target.delete(key);
            if (deleted) changed();
            return deleted;
          };
          else if (property === 'clear') method = () => {
            if (target.size === 0) return;
            target.clear();
            changed();
          };
          else if (property === 'get') method = (key: unknown) => wrap(target.get(unwrap(key)));
          else if (property === 'has') method = (key: unknown) => target.has(unwrap(key));
          else if (property === 'forEach') method = (callback: Function, thisArg?: unknown) =>
            target.forEach((entryValue, key) => callback.call(thisArg, wrap(entryValue), wrap(key), proxy));
          else if (property === 'values') method = function* () {
            for (const entryValue of target.values()) yield wrap(entryValue);
          };
          else if (property === 'keys') method = function* () {
            for (const key of target.keys()) yield wrap(key);
          };
          else if (property === 'entries' || property === Symbol.iterator) method = function* () {
            for (const [key, entryValue] of target.entries()) yield [wrap(key), wrap(entryValue)];
          };
          else {
            const value = Reflect.get(target, property, target);
            if (typeof value !== 'function') return value;
            if (property === 'constructor') return value;
            method = value.bind(target);
          }
          methods.set(property, method);
          return method;
        }
      });
      cache.set(input, proxy);
      rawByProxy.set(proxy, input);
      return proxy;
    }

    if (input instanceof Set) {
      let proxy: Set<any>;
      const methods = new Map<PropertyKey, unknown>();
      proxy = new Proxy(input, {
        get(target, property) {
          const invariant = invariantValue(target, property);
          if (invariant.locked) return invariant.value;
          if (methods.has(property)) return methods.get(property);
          let method: unknown;
          if (property === 'add') method = (entryValue: unknown) => {
            entryValue = unwrap(entryValue);
            const existed = target.has(entryValue);
            target.add(entryValue);
            if (!existed) changed();
            return proxy;
          };
          else if (property === 'delete') method = (entryValue: unknown) => {
            entryValue = unwrap(entryValue);
            const deleted = target.delete(entryValue);
            if (deleted) changed();
            return deleted;
          };
          else if (property === 'clear') method = () => {
            if (target.size === 0) return;
            target.clear();
            changed();
          };
          else if (property === 'has') method = (entryValue: unknown) => target.has(unwrap(entryValue));
          else if (property === 'forEach') method = (callback: Function, thisArg?: unknown) =>
            target.forEach(entryValue => {
              const wrapped = wrap(entryValue);
              callback.call(thisArg, wrapped, wrapped, proxy);
            });
          else if (property === 'values' || property === 'keys' || property === Symbol.iterator) method = function* () {
            for (const entryValue of target.values()) yield wrap(entryValue);
          };
          else if (property === 'entries') method = function* () {
            for (const entryValue of target.values()) {
              const wrapped = wrap(entryValue);
              yield [wrapped, wrapped];
            }
          };
          else {
            const value = Reflect.get(target, property, target);
            if (typeof value !== 'function') return value;
            if (property === 'constructor') return value;
            method = value.bind(target);
          }
          methods.set(property, method);
          return method;
        }
      });
      cache.set(input, proxy);
      rawByProxy.set(proxy, input);
      return proxy;
    }

    if (!Array.isArray(input) && !isPlainObject(input)) return input;

    const proxy = new Proxy(input, {
      get(target, property, receiver) {
        const invariant = invariantValue(target, property);
        return invariant.locked
          ? invariant.value
          : wrap(Reflect.get(target, property, receiver));
      },
      set(target, property, next, receiver) {
        const previous = Reflect.get(target, property, receiver);
        next = unwrap(next);
        // Write directly to the wrapped target. Passing the proxy as the
        // receiver re-enters defineProperty for an ordinary assignment and
        // would report the same mutation twice.
        const result = Reflect.set(target, property, next);
        if (result && !Object.is(previous, next)) changed();
        return result;
      },
      deleteProperty(target, property) {
        const existed = Object.prototype.hasOwnProperty.call(target, property);
        const result = Reflect.deleteProperty(target, property);
        if (result && existed) changed();
        return result;
      },
      defineProperty(target, property, descriptor) {
        const previous = Reflect.getOwnPropertyDescriptor(target, property);
        const nextDescriptor = 'value' in descriptor
          ? { ...descriptor, value: unwrap(descriptor.value) }
          : descriptor;
        const result = Reflect.defineProperty(target, property, nextDescriptor);
        const current = result ? Reflect.getOwnPropertyDescriptor(target, property) : previous;
        if (result && !descriptorsEqual(previous, current)) changed();
        return result;
      }
    });
    cache.set(input, proxy);
    rawByProxy.set(proxy, input);
    return proxy;
  };

  return wrap(value);
}
