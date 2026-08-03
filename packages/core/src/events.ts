import { DISPATCH_TIMERS } from './symbols';
import { DispatchOptions } from './types/dispatch-options';
import { resolveScope } from './utils';
import { defaultCommunicationTarget, requireDaemonTarget } from './daemon-target';

// @dispatch decorator - auto-dispatches custom events from method return values


/**
 * Decorator that automatically dispatches a custom event after a method is called.
 * The return value of the method becomes the event detail.
 *
 * @param eventName The name of the event to dispatch
 * @param options Optional configuration extending EventInit
 */
export function dispatch(eventName: string, options?: DispatchOptions) {
  return function (originalMethod: any, _context: ClassMethodDecoratorContext) {
    return function (this: any, ...args: any[]) {
      // Create timing wrappers for dispatch (per-instance)
      if (!this[DISPATCH_TIMERS]) {
        this[DISPATCH_TIMERS] = new Map();
      }

      const timerKey = `${eventName}_${_context.name as string}`;
      if (!this[DISPATCH_TIMERS].has(timerKey)) {
        this[DISPATCH_TIMERS].set(timerKey, {
          debounceTimeout: null,
          throttleLastCall: 0,
          throttleTimeout: null
        });
      }

      const timers = this[DISPATCH_TIMERS].get(timerKey);

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
        if (options?.debounce) {
          clearTimeout(timers.debounceTimeout);
          timers.debounceTimeout = setTimeout(() => doDispatch(detail), options.debounce);
          return;
        }

        if (!options?.throttle) {
          doDispatch(detail);
          return;
        }

        const now = Date.now();
        const remaining = options.throttle - (now - timers.throttleLastCall);

        if (remaining <= 0) {
          clearTimeout(timers.throttleTimeout);
          timers.throttleLastCall = now;
          doDispatch(detail);
          return;
        }

        // Record the LATEST detail so the trailing dispatch carries fresh
        // data, not the first-suppressed-call detail captured by closure.
        timers.latestDetail = detail;
        if (!timers.throttleTimeout) {
          timers.throttleTimeout = setTimeout(() => {
            timers.throttleLastCall = Date.now();
            timers.throttleTimeout = null;
            const d = timers.latestDetail;
            timers.latestDetail = undefined;
            doDispatch(d);
          }, remaining);
        }
      };
      
      // Handle async methods
      if (result instanceof Promise) {
        return result.then((resolvedResult: any) => {
          timedDispatch(resolvedResult);
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
export function clearDispatchTimers(instance: any): void {
  const timers = instance[DISPATCH_TIMERS];
  if (!timers) return;

  for (const t of timers.values()) {
    if (t.debounceTimeout) clearTimeout(t.debounceTimeout);
    if (t.throttleTimeout) clearTimeout(t.throttleTimeout);
    t.debounceTimeout = null;
    t.throttleTimeout = null;
    t.throttleLastCall = 0;
    t.latestDetail = undefined;
  }
}
