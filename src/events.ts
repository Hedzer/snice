import { DISPATCH_TIMERS } from './symbols';
import { DispatchOptions } from './types/dispatch-options';

// @on decorator removed in v3.0.0 - use template event syntax instead: @click=${handler}


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
        
        // Create event with spread operator for options
        const event = new CustomEvent(eventName, {
          bubbles: true,  // Default to true for component events
          composed: true, // Allow crossing shadow DOM boundaries
          ...options,     // Spread all EventInit options
          detail
        });
        
        this.dispatchEvent(event);
      };
      
      // Helper to handle timed dispatch
      const timedDispatch = (detail: any) => {
        if (options?.debounce) {
          clearTimeout(timers.debounceTimeout);
          timers.debounceTimeout = setTimeout(() => doDispatch(detail), options.debounce);
        } else if (options?.throttle) {
          const now = Date.now();
          const remaining = options.throttle - (now - timers.throttleLastCall);

          if (remaining <= 0) {
            clearTimeout(timers.throttleTimeout);
            timers.throttleLastCall = now;
            doDispatch(detail);
          } else if (!timers.throttleTimeout) {
            timers.throttleTimeout = setTimeout(() => {
              timers.throttleLastCall = Date.now();
              timers.throttleTimeout = null;
              doDispatch(detail);
            }, remaining);
          }
        } else {
          doDispatch(detail);
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