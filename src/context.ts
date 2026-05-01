/**
 * @context decorator for receiving router context updates
 */

import { CONTEXT_HANDLER, NAVIGATION_CONTEXT_INSTANCE, CONTEXT_REGISTER, CONTEXT_UNREGISTER, CONTEXT_TIMER, CONTEXT_CALLED, CONTEXT_METHODS, WRAPPED_CONTEXT_HANDLERS } from './symbols';
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
 * Works on both methods and fields:
 *
 * - **Method form**: the method is invoked with the current Context on every
 *   update (and once at register time so the first render sees the context).
 * - **Field form**: the field is overwritten with the current Context on
 *   every update (and once at register time). Pair with `@property` if you
 *   want assignment to also schedule a re-render.
 *
 * @example
 * ```typescript
 * @element('my-layout')
 * class MyLayout extends HTMLElement {
 *   // Method form
 *   @context()
 *   handleContext(ctx: Context) {
 *     this.renderNav(ctx.navigation.placards, ctx.navigation.route);
 *   }
 *
 *   // Field form — the field is populated before first render
 *   @context() ctx!: Context;
 *
 *   // Field + @property — assignment also triggers re-render
 *   @property({ attribute: false }) @context() reactiveCtx!: Context;
 * }
 * ```
 */
export function context(options: ContextOptions = {}) {
  return function (value: any, decoratorContext: ClassMethodDecoratorContext | ClassFieldDecoratorContext) {
    const name = decoratorContext.name as string;
    const kind = decoratorContext.kind;

    const registerHandler = function (this: any) {
      const constructor = this.constructor as any;

      // De-dupe: methods identify by reference, fields identify by name.
      if (!Object.prototype.hasOwnProperty.call(constructor, CONTEXT_METHODS)) {
        constructor[CONTEXT_METHODS] = new Set();
      }
      const dedupeKey = kind === 'method' ? value : `field:${name}`;
      if (constructor[CONTEXT_METHODS].has(dedupeKey)) return;
      constructor[CONTEXT_METHODS].add(dedupeKey);

      if (!Object.prototype.hasOwnProperty.call(constructor, CONTEXT_HANDLERS)) {
        const inherited = constructor[CONTEXT_HANDLERS];
        constructor[CONTEXT_HANDLERS] = inherited ? [...inherited] : [];
      }

      if (kind === 'method') {
        constructor[CONTEXT_HANDLERS].push({
          kind: 'method',
          methodName: name,
          method: value,
          options,
        });
      } else if (kind === 'field' || kind === 'accessor') {
        constructor[CONTEXT_HANDLERS].push({
          kind: 'field',
          fieldName: name,
          options,
        });
      }
    };

    if (kind === 'method') {
      decoratorContext.addInitializer(registerHandler);
      return value;
    }

    // Field decorators: do registration via the init function (fires per
    // instance during construction, with `this` bound). Returning the init
    // function is the canonical Stage 3 way for field decorators —
    // `addInitializer` for fields can be late or unreliable across runtimes.
    return function (this: any, initialValue: any) {
      registerHandler.call(this);
      return initialValue;
    };
  };
}

/**
 * Setup context handler for an element instance
 * Called automatically during element connection
 */
// Accepts an HTMLElement OR a controller instance — both are plain objects
// that may carry CONTEXT_HANDLER and a constructor with CONTEXT_HANDLERS.
export function setupContextHandler(element: any) {
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

  // Per-element Map of handler-name → wrapped function. Symbol-keyed so it
  // doesn't pollute the element's public surface.
  let wrapped: Map<string, (ctx: Context) => void> = (element as any)[WRAPPED_CONTEXT_HANDLERS];
  if (!wrapped) {
    wrapped = new Map();
    (element as any)[WRAPPED_CONTEXT_HANDLERS] = wrapped;
  }

  // Register each handler with the Context
  for (const handler of handlers) {
    const { kind, options } = handler;
    const handlerName = kind === 'field' ? handler.fieldName : handler.methodName;

    // Create wrapped method with timing controls
    const wrappedFn = function (context: Context) {
      // Skip if already called once
      if (options.once && (element as any)[CONTEXT_CALLED]) {
        return;
      }

      const callMethod = () => {
        if (kind === 'field') {
          (element as any)[handler.fieldName] = context;
        } else {
          handler.method.call(element, context);
        }

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
      const timerKey = handlerName;

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

    wrapped.set(handlerName, wrappedFn);

    // Register with the Context using the handler name (lookup goes through
    // the WRAPPED_CONTEXT_HANDLERS Map on the element).
    if (typeof ctx[CONTEXT_REGISTER] === 'function') {
      (ctx[CONTEXT_REGISTER] as (element: HTMLElement, methodName: string) => void)(element, handlerName);
    }

    // Synchronously emit current context to the just-registered handler so
    // field/method values are populated BEFORE the first render microtask
    // flushes — eliminates the cold-render flicker where ctx is undefined.
    try {
      wrappedFn(ctx);
    } catch (error) {
      console.error(`Error invoking @context handler at registration:`, error);
    }
  }
}

/**
 * Cleanup context handler for an element instance
 * Called automatically during element disconnection
 */
export function cleanupContextHandler(element: any) {
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

  // Drop the per-element wrapped-handlers Map.
  delete (element as any)[WRAPPED_CONTEXT_HANDLERS];

  // Unregister from Context if available
  const ctx = (element as any)[NAVIGATION_CONTEXT_INSTANCE];
  if (ctx && typeof ctx[CONTEXT_UNREGISTER] === 'function') {
    (ctx[CONTEXT_UNREGISTER] as (element: HTMLElement) => void)(element);
  }

  delete (element as any)[NAVIGATION_CONTEXT_INSTANCE];
  delete (element as any)[CONTEXT_CALLED];
}
