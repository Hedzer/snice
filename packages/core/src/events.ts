import { DISPATCH_TIMERS, getSymbol } from './symbols';
import { DispatchOptions } from './types/dispatch-options';
import { resolveEventTiming, resolveScope } from './utils';
import { defaultCommunicationTarget, requireDaemonTarget } from './daemon-target';

// @dispatch decorator - auto-dispatches custom events from method return values

const DISPATCH_GENERATION = getSymbol('dispatch-generation');
const DISPATCH_TEARDOWN_GENERATION = getSymbol('dispatch-teardown-generation');
const DISPATCH_CONTEXT_INSTANCE = getSymbol('dispatch-context-instance');
const DISPATCH_CONTEXT_GENERATION = getSymbol('dispatch-context-generation');

function platformOwnsMethod(property: PropertyKey): boolean {
  if (typeof HTMLElement === 'undefined') return false;
  let prototype: object | null = HTMLElement.prototype;
  while (prototype) {
    if (Object.prototype.hasOwnProperty.call(prototype, property)) return true;
    prototype = Object.getPrototypeOf(prototype);
  }
  return false;
}

function isDispatchGenerationActive(instance: any, generation: number): boolean {
  return (instance[DISPATCH_GENERATION] ?? 0) === generation
    && instance[DISPATCH_TEARDOWN_GENERATION] !== generation;
}


/**
 * Decorator that automatically dispatches a custom event after a method is called.
 * The return value of the method becomes the event detail.
 *
 * @param eventName The name of the event to dispatch
 * @param options Optional configuration extending EventInit
 */
export function dispatch(eventName: string, options?: DispatchOptions) {
  return function (originalMethod: any, _context: ClassMethodDecoratorContext) {
    // Decorator-instance identity avoids collisions such as event `a_b` on
    // method `c` versus event `a` on method `b_c`.
    const timerKey = Symbol(`@dispatch:${eventName}`);

    return function (this: any, ...args: any[]) {
      const instance = this[DISPATCH_CONTEXT_INSTANCE] ?? this;
      // Resolve against the actual decorated instance for every invocation.
      // Capture the generation before calling an async method so teardown can
      // invalidate work that has not reached the scheduling step yet.
      const generation = this[DISPATCH_CONTEXT_GENERATION]
        ?? instance[DISPATCH_GENERATION]
        ?? 0;

      // A teardown receiver keeps the generation that owned its lifecycle
      // callback across `await`. Once a reconnect advances the instance, a
      // stale continuation may still run its method body, but it must not
      // inspect or supersede the current generation's dispatch state.
      if (!isDispatchGenerationActive(instance, generation)) {
        return originalMethod.apply(this, args);
      }

      const debounceDelay = resolveEventTiming(instance, options?.debounce, '@dispatch', 'debounce');
      const throttleDelay = debounceDelay && debounceDelay > 0
        ? undefined
        : resolveEventTiming(instance, options?.throttle, '@dispatch', 'throttle');

      // Create timing wrappers for dispatch (per-instance)
      if (!instance[DISPATCH_TIMERS]) {
        instance[DISPATCH_TIMERS] = new Map();
      }

      if (!instance[DISPATCH_TIMERS].has(timerKey)) {
        instance[DISPATCH_TIMERS].set(timerKey, {
          debounceTimeout: null,
          throttleLastCall: 0,
          throttleTimeout: null,
          invocation: 0,
        });
      }

      const timers = instance[DISPATCH_TIMERS].get(timerKey);
      const invocation = ++timers.invocation;
      timers.ownerGeneration = generation;

      // A new invocation supersedes deferred work for this decorated method.
      // In particular, a resolver changing debounce to 0 must not leave the
      // previous positive-delay timer armed. Throttle trailing work is also
      // rebuilt below using this invocation's freshly resolved interval.
      if (timers.debounceTimeout) clearTimeout(timers.debounceTimeout);
      timers.debounceTimeout = null;
      if (timers.throttleTimeout) clearTimeout(timers.throttleTimeout);
      timers.throttleTimeout = null;
      timers.latestDetail = undefined;

      if (debounceDelay && debounceDelay > 0) {
        // Switching from throttle to debounce starts a new timing regime.
        timers.throttleLastCall = 0;
      } else if (!throttleDelay || throttleDelay <= 0) {
        // An un-timed invocation cancels both old regimes completely.
        timers.throttleLastCall = 0;
      }

      // Call the original method with preserved this context
      const result = originalMethod.apply(this, args);
      
      // Helper to dispatch the event
      const doDispatch = (detail: any) => {
        // Skip dispatch if result is undefined and dispatchOnUndefined is false
        if (detail === undefined && options?.dispatchOnUndefined === false) {
          return;
        }

        // Copy only platform EventInit fields; Snice-only decorator options do
        // not belong in the CustomEvent constructor dictionary.
        const event = new CustomEvent(eventName, {
          bubbles: options?.bubbles ?? true,
          cancelable: options?.cancelable ?? false,
          composed: options?.composed ?? true,
          detail
        });

        if (options?.scope !== undefined && options?.daemon !== undefined) {
          throw new TypeError(
            `@dispatch('${eventName}') cannot use both scope and daemon.`
          );
        }

        if (options?.daemon !== undefined) {
          requireDaemonTarget(this, options.daemon).dispatchEvent(event);
          return;
        }

        if (options?.scope !== undefined) {
          const target = resolveScope(this as HTMLElement, options.scope);
          if (!target) {
            console.warn(
              `[snice/@dispatch] scope did not resolve for "${eventName}" — event not dispatched.`
            );
            return;
          }
          target.dispatchEvent(event);
          return;
        }

        const target = defaultCommunicationTarget(this);
        if (!target) {
          throw new TypeError(
            `@dispatch('${eventName}') requires an element, attached controller, or provided @daemon instance.`
          );
        }
        target.dispatchEvent(event);
      };
      
      // Helper to handle timed dispatch
      const timedDispatch = (detail: any) => {
        if (!isDispatchGenerationActive(instance, generation)) return;

        if (debounceDelay && debounceDelay > 0) {
          timers.debounceTimeout = setTimeout(() => {
            timers.debounceTimeout = null;
            if (isDispatchGenerationActive(instance, generation) && timers.invocation === invocation) {
              doDispatch(detail);
            }
          }, debounceDelay);
          return;
        }

        if (!throttleDelay || throttleDelay <= 0) {
          doDispatch(detail);
          return;
        }

        const now = Date.now();
        const remaining = throttleDelay - (now - timers.throttleLastCall);

        if (remaining <= 0) {
          clearTimeout(timers.throttleTimeout);
          timers.throttleLastCall = now;
          doDispatch(detail);
          return;
        }

        // Record the LATEST detail so the trailing dispatch carries fresh
        // data, not the first-suppressed-call detail captured by closure.
        timers.latestDetail = detail;
        // Always schedule from the last actual dispatch using the interval
        // resolved for THIS invocation. A later invocation can therefore
        // lengthen or shorten the pending trailing window coherently.
        timers.throttleTimeout = setTimeout(() => {
          timers.throttleLastCall = Date.now();
          timers.throttleTimeout = null;
          const d = timers.latestDetail;
          timers.latestDetail = undefined;
          if (isDispatchGenerationActive(instance, generation) && timers.invocation === invocation) {
            doDispatch(d);
          }
        }, remaining);
      };
      
      // Handle async methods
      if (result instanceof Promise) {
        return result.then((resolvedResult: any) => {
          const usesDeferredTiming = (debounceDelay ?? 0) > 0 || (throttleDelay ?? 0) > 0;
          if (
            isDispatchGenerationActive(instance, generation)
            && (!usesDeferredTiming || timers.invocation === invocation)
          ) {
            timedDispatch(resolvedResult);
          }
          return resolvedResult;
        });
      }
      
      // Sync method
      timedDispatch(result);
      return result;
    };
  };
}

/**
 * Clear any pending debounce/throttle dispatch timers on an instance (e.g. on
 * disconnect, so a queued event doesn't fire into a detached node). A dispatch
 * is a one-shot signal, so pending ones are dropped, not replayed.
 */
export function clearDispatchTimers(instance: any): number {
  const generation = (instance[DISPATCH_GENERATION] ?? 0) + 1;
  instance[DISPATCH_GENERATION] = generation;
  const timers = instance[DISPATCH_TIMERS];
  if (!timers) return generation;

  for (const t of timers.values()) {
    if (t.debounceTimeout) clearTimeout(t.debounceTimeout);
    if (t.throttleTimeout) clearTimeout(t.throttleTimeout);
    t.debounceTimeout = null;
    t.throttleTimeout = null;
    t.throttleLastCall = 0;
    t.latestDetail = undefined;
    t.invocation = (t.invocation ?? 0) + 1;
  }
  return generation;
}

/** Begin an element disconnect generation; dispatches remain inactive in hooks. */
export function beginDispatchTeardown(instance: any): number {
  const generation = clearDispatchTimers(instance);
  instance[DISPATCH_TEARDOWN_GENERATION] = generation;
  return generation;
}

/**
 * Give one disconnect lifecycle a stable receiver token. The Proxy is local to
 * that callback chain, so native browser async continuations retain the token
 * without Node-only async context. Platform methods remain bound to the real
 * element to satisfy Web IDL receiver checks.
 */
export function createDispatchTeardownContext(instance: any, generation: number): any {
  return new Proxy(instance, {
    get(target, property) {
      if (property === DISPATCH_CONTEXT_INSTANCE) return target;
      if (property === DISPATCH_CONTEXT_GENERATION) return generation;
      const value = Reflect.get(target, property, target);
      if (typeof value === 'function' && platformOwnsMethod(property)) {
        return value.bind(target);
      }
      return value;
    },
    set(target, property, value) {
      return Reflect.set(target, property, value, target);
    },
  });
}

/** Activate a fresh generation when an element reconnects during async teardown. */
export function activateDispatchTimers(instance: any): void {
  if (instance[DISPATCH_TEARDOWN_GENERATION] === undefined) return;
  instance[DISPATCH_GENERATION] = (instance[DISPATCH_GENERATION] ?? 0) + 1;
  delete instance[DISPATCH_TEARDOWN_GENERATION];
}

/** Clear only work owned by a completed disconnect generation. */
export function finishDispatchTeardown(instance: any, generation: number): void {
  const timers = instance[DISPATCH_TIMERS];
  if (timers) {
    for (const t of timers.values()) {
      if (t.ownerGeneration !== generation) continue;
      if (t.debounceTimeout) clearTimeout(t.debounceTimeout);
      if (t.throttleTimeout) clearTimeout(t.throttleTimeout);
      t.debounceTimeout = null;
      t.throttleTimeout = null;
      t.throttleLastCall = 0;
      t.latestDetail = undefined;
      t.invocation = (t.invocation ?? 0) + 1;
    }
  }

  if ((instance[DISPATCH_GENERATION] ?? 0) === generation) {
    const inactiveGeneration = generation + 1;
    instance[DISPATCH_GENERATION] = inactiveGeneration;
    instance[DISPATCH_TEARDOWN_GENERATION] = inactiveGeneration;
  } else if (instance[DISPATCH_TEARDOWN_GENERATION] === generation) {
    // A different lifecycle transition advanced the generation already.
    delete instance[DISPATCH_TEARDOWN_GENERATION];
  }
}
