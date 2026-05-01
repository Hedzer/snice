/**
 * @context decorator for receiving router context updates
 */

import { CONTEXT_HANDLER, NAVIGATION_CONTEXT_INSTANCE, CONTEXT_REGISTER, CONTEXT_UNREGISTER, CONTEXT_TIMER, CONTEXT_CALLED, CONTEXT_METHODS } from './symbols';
import { getSymbol } from './symbols';
import type { Context } from './types/context';

const CONTEXT_HANDLERS = getSymbol('context-handlers');

/**
 * Options for the @context decorator
 */
export interface ContextOptions {
  /** Debounce delay in milliseconds - waits for quiet period before calling */
  debounce?: number;
  /** Throttle delay in milliseconds - limits calls to at most once per period */
  throttle?: number;
  /** Only call the method once, then unregister */
  once?: boolean;
}

/**
 * @context decorator for receiving router context updates
 *
 * @example
 * ```typescript
 * @element('my-layout')
 * class MyLayout extends HTMLElement {
 *   @context
 *   handleContext(ctx: Context) {
 *     this.renderNav(ctx.placards, ctx.currentRoute);
 *   }
 *
 *   @context({ debounce: 300 })
 *   handleContextDebounced(ctx: Context) {
 *     // Called after 300ms of no updates
 *   }
 * }
 * ```
 */
export function context(options: ContextOptions = {}) {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;
    context.addInitializer(function (this: any) {
      const constructor = this.constructor as any;

      // hasOwnProperty guards so subclasses don't mutate parent state via
      // the prototype chain.
      if (!Object.prototype.hasOwnProperty.call(constructor, CONTEXT_METHODS)) {
        constructor[CONTEXT_METHODS] = new Set();
      }
      if (constructor[CONTEXT_METHODS].has(originalMethod)) return;
      constructor[CONTEXT_METHODS].add(originalMethod);

      if (!Object.prototype.hasOwnProperty.call(constructor, CONTEXT_HANDLERS)) {
        const inherited = constructor[CONTEXT_HANDLERS];
        constructor[CONTEXT_HANDLERS] = inherited ? [...inherited] : [];
      }

      constructor[CONTEXT_HANDLERS].push({
        methodName,
        method: originalMethod,
        options,
      });
    });

    return originalMethod;
  };
}

/**
 * Setup context handler for an element instance
 * Called automatically during element connection
 */
export function setupContextHandler(element: HTMLElement) {
  const handlers = (element.constructor as any)[CONTEXT_HANDLERS];
  if (!handlers || !Array.isArray(handlers) || handlers.length === 0) {
    return;
  }

  // Get the Context instance from the router
  const ctx = (element as any)[CONTEXT_HANDLER];
  if (!ctx) {
    return;
  }

  // Store the Context instance for cleanup
  (element as any)[NAVIGATION_CONTEXT_INSTANCE] = ctx;

  // Register each handler with the Context
  for (const handler of handlers) {
    const { methodName, method, options } = handler;
    const wrappedMethodName = `__wrapped_${methodName}`;

    // Create wrapped method with timing controls
    (element as any)[wrappedMethodName] = function (context: Context) {
      // Skip if already called once
      if (options.once && (element as any)[CONTEXT_CALLED]) {
        return;
      }

      const callMethod = () => {
        method.call(element, context);

        // Handle once option
        if (options.once) {
          (element as any)[CONTEXT_CALLED] = true;
          // Unregister after first call
          const ctx = (element as any)[NAVIGATION_CONTEXT_INSTANCE];
          if (ctx && typeof ctx[CONTEXT_UNREGISTER] === 'function') {
            (ctx[CONTEXT_UNREGISTER] as (element: HTMLElement) => void)(element);
          }
        }
      };

      // Per-handler timer slot to avoid debounce/throttle handlers on the same
      // element overwriting each other's state.
      const timerSlot = (element as any)[CONTEXT_TIMER] ||
        ((element as any)[CONTEXT_TIMER] = {} as Record<string, any>);
      const timerKey = methodName;

      if (options.debounce) {
        clearTimeout(timerSlot[timerKey]?.timeout);
        timerSlot[timerKey] = {
          timeout: setTimeout(callMethod, options.debounce),
        };
        return;
      }

      if (options.throttle) {
        const now = Date.now();
        const lastCall = timerSlot[timerKey]?.lastCall || 0;
        if (now - lastCall >= options.throttle) {
          timerSlot[timerKey] = { lastCall: now };
          callMethod();
        }
        return;
      }

      callMethod();
    };

    // Register with the Context using the wrapped method name
    if (typeof ctx[CONTEXT_REGISTER] === 'function') {
      (ctx[CONTEXT_REGISTER] as (element: HTMLElement, methodName: string) => void)(element, wrappedMethodName);
    }
  }
}

/**
 * Cleanup context handler for an element instance
 * Called automatically during element disconnection
 */
export function cleanupContextHandler(element: HTMLElement) {
  const handlers = (element.constructor as any)[CONTEXT_HANDLERS];
  if (!handlers || !Array.isArray(handlers) || handlers.length === 0) {
    return;
  }

  // Clear any pending debounce timers (per-handler slots)
  const timerSlot = (element as any)[CONTEXT_TIMER];
  if (timerSlot && typeof timerSlot === 'object') {
    for (const key of Object.keys(timerSlot)) {
      if (timerSlot[key]?.timeout) clearTimeout(timerSlot[key].timeout);
    }
    delete (element as any)[CONTEXT_TIMER];
  }

  for (const handler of handlers) {

    // Clean up wrapped method
    const wrappedMethodName = `__wrapped_${handler.methodName}`;
    delete (element as any)[wrappedMethodName];
  }

  // Unregister from Context if available
  const ctx = (element as any)[NAVIGATION_CONTEXT_INSTANCE];
  if (ctx && typeof ctx[CONTEXT_UNREGISTER] === 'function') {
    (ctx[CONTEXT_UNREGISTER] as (element: HTMLElement) => void)(element);
  }

  delete (element as any)[NAVIGATION_CONTEXT_INSTANCE];
  delete (element as any)[CONTEXT_CALLED];
}
