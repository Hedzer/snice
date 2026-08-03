/**
 * @on decorator for listening to events
 * Use in elements or controllers to listen to DOM events or custom events
 */

import { CLEANUP, ON_METHODS } from './symbols';
import { getSymbol } from './symbols';
import type { OnOptions } from './types/on-options';
import { parseKeyboardFilter, matchesKeyboardFilter, warnIfModifierMisuse, type KeyboardFilter } from './parts';
import { createDebounced, resolveScope } from './utils';
import { isDaemonInstance, requireDaemonTarget } from './daemon-target';

// Re-export OnOptions for public API
export type { OnOptions } from './types/on-options';

const ON_HANDLERS = getSymbol('on-handlers');

/**
 * @on decorator for listening to events
 *
 * Works in both elements and controllers with full event delegation support.
 *
 * @param eventName - Event name(s) to listen for
 * @param selector - Optional CSS selector for event delegation
 * @param options - Event listener options including debounce/throttle
 *
 * @example
 * ```typescript
 * // In elements
 * @element('my-button')
 * class MyButton extends HTMLElement {
 *   @on('click', 'button')
 *   handleClick(e: MouseEvent) {
 *     console.log('Button clicked!', e);
 *   }
 *
 *   @on('input', 'input', { debounce: 300 })
 *   handleInput(e: Event) {
 *     console.log('Input changed:', (e.target as HTMLInputElement).value);
 *   }
 * }
 *
 * // In controllers
 * @controller('my-controller')
 * class MyController {
 *   element!: HTMLElement;
 *
 *   @on('count-changed')
 *   handleCountChanged(e: CustomEvent) {
 *     console.log('Count changed to:', e.detail.count);
 *   }
 *
 *   @on('click', '.item', { throttle: 100 })
 *   handleItemClick(e: MouseEvent) {
 *     console.log('Item clicked');
 *   }
 * }
 * ```
 */
export function on(
  eventName: string | string[],
  selectorOrOptions?: string | OnOptions | null,
  options?: OnOptions
) {
  // Parse arguments to support multiple call signatures
  let selector: string | null = null;
  let opts: OnOptions = {};

  if (typeof selectorOrOptions === 'string') {
    selector = selectorOrOptions;
    opts = options || {};
  } else if (selectorOrOptions && typeof selectorOrOptions === 'object') {
    opts = selectorOrOptions;
  } else if (selectorOrOptions === null && options) {
    opts = options;
  }

  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;
    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      // Dedup by registration identity (method + events + selector), NOT by
      // method reference alone — stacked @on decorators share one method and
      // must each register. Use hasOwnProperty so subclasses get their OWN
      // Set instead of inheriting — otherwise parent and child share state
      // and child registrations pollute parent (and vice versa) via the
      // prototype chain.
      const eventNames = Array.isArray(eventName) ? eventName : [eventName];
      const registrationKey = `${methodName}::${eventNames.join(',')}::${selector ?? ''}::daemon:${opts.daemon ?? ''}`;

      if (!Object.prototype.hasOwnProperty.call(constructor, ON_METHODS)) {
        constructor[ON_METHODS] = new Set();
      }
      if (constructor[ON_METHODS].has(registrationKey)) return;
      constructor[ON_METHODS].add(registrationKey);

      if (!Object.prototype.hasOwnProperty.call(constructor, ON_HANDLERS)) {
        // Seed with parent's handlers (if any) so inherited @on still fires.
        const inherited = constructor[ON_HANDLERS];
        constructor[ON_HANDLERS] = inherited ? [...inherited] : [];
      }

      for (const event of eventNames) {
        constructor[ON_HANDLERS].push({
          eventName: event,
          selector,
          methodName,
          method: originalMethod,
          options: opts
        });
      }
    });

    return originalMethod;
  };
}

// Note: on.ts uses leading-edge-only throttle (no trailing call).
// createThrottled from utils has leading+trailing, so we keep a local leading-only variant.
function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let lastCall = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  } as T;
}

/**
 * Events that don't bubble - these require capture phase for delegation
 */
const NON_BUBBLING_EVENTS = new Set([
  'scroll',
  'focus',
  'blur',
  'load',
  'unload',
  'error',
  'resize',
  'abort',
  'mouseenter',
  'mouseleave',
  'pointerenter',
  'pointerleave',
]);

/**
 * Setup event listeners for an element or controller instance
 * Called automatically during element connection or controller attachment
 */
export function setupEventHandlers(instance: any, targetElement: EventTarget) {
  const handlers = instance.constructor[ON_HANDLERS];
  if (!handlers || !Array.isArray(handlers) || handlers.length === 0) {
    return;
  }

  // Initialize cleanup object if needed
  if (!instance[CLEANUP]) {
    instance[CLEANUP] = { events: [], channels: [], observers: [] };
  } else if (!instance[CLEANUP].events) {
    instance[CLEANUP].events = [];
  } else if (instance[CLEANUP].events.length > 0) {
    // Events already set up - clean them up first to avoid duplicates
    cleanupEventHandlers(instance);
  }

  for (const handler of handlers) {
    // Get current method from instance (preserves decorator stacking)
    const currentMethod = (instance as any)[handler.methodName];
    let boundMethod = currentMethod ? currentMethod.bind(instance) : handler.method.bind(instance);
    const handlerOptions = handler.options || {};

    // Parse event name for key modifiers
    // Supports both dot notation (@keydown.enter) and colon notation (@keydown:Enter)
    // Only parse colons for keyboard events, not custom events
    const isKeyboardEvent = ['keydown', 'keyup', 'keypress'].includes(handler.eventName.split('.')[0].split(':')[0]);
    // Only keyboard events split on `.`/`:` into a key filter — a custom event
    // name may legitimately contain a dot (e.g. `app.ready`) and must be kept whole.
    const dotIndex = isKeyboardEvent ? handler.eventName.indexOf('.') : -1;
    const colonIndex = isKeyboardEvent ? handler.eventName.indexOf(':') : -1;

    const delimiterIndex = dotIndex > 0 && colonIndex > 0
      ? Math.min(dotIndex, colonIndex)
      : Math.max(dotIndex, colonIndex);

    const baseEventName = delimiterIndex > 0
      ? handler.eventName.substring(0, delimiterIndex)
      : handler.eventName;

    const keyModifier = delimiterIndex > 0
      ? handler.eventName.substring(delimiterIndex + 1)
      : null;

    if (delimiterIndex <= 0) warnIfModifierMisuse(handler.eventName);

    // Apply debounce (takes precedence over throttle)
    if (handlerOptions.debounce && handlerOptions.debounce > 0) {
      boundMethod = createDebounced(boundMethod, handlerOptions.debounce);
    } else if (handlerOptions.throttle && handlerOptions.throttle > 0) {
      boundMethod = throttle(boundMethod, handlerOptions.throttle);
    }

    // Create event handler with key modifier support
    // Uses shared keyboard filter implementation from parts.ts
    let keyFilter: KeyboardFilter | null = null;
    if (keyModifier && ['keydown', 'keyup', 'keypress'].includes(baseEventName)) {
      keyFilter = parseKeyboardFilter(keyModifier);
    }

    const createKeyModifierHandler = (method: Function): Function => {
      if (!keyFilter) {
        return method;
      }

      return (event: Event) => {
        const keyEvent = event as KeyboardEvent;
        if (matchesKeyboardFilter(keyEvent, keyFilter)) {
          method(event);
        }
      };
    };

    // Apply key modifier wrapper
    const keyModifierMethod = createKeyModifierHandler(boundMethod);

    // Resolve an explicit DOM scope or an app-context daemon. They are two
    // distinct addressing models and may not be combined.
    const hasExplicitScope = handlerOptions.scope !== undefined;
    const hasDaemon = handlerOptions.daemon !== undefined;
    if (hasExplicitScope && hasDaemon) {
      console.warn(
        `[snice/@on] "${handler.eventName}" cannot use both scope and daemon — listener skipped.`
      );
      continue;
    }
    if ((hasDaemon || isDaemonInstance(instance)) && handler.selector) {
      console.warn(
        `[snice/@on] "${handler.eventName}" cannot delegate "${handler.selector}" on a daemon target — listener skipped.`
      );
      continue;
    }

    const hasExplicitTarget = hasExplicitScope || hasDaemon;
    let scopedTarget: EventTarget | null = null;
    if (hasDaemon) {
      try {
        scopedTarget = requireDaemonTarget(instance, handlerOptions.daemon);
      } catch (error) {
        console.warn(`[snice/@on] ${(error as Error).message} Listener "${handler.eventName}" skipped.`);
        continue;
      }
    } else if (hasExplicitScope) {
      scopedTarget = resolveScope(targetElement as HTMLElement, handlerOptions.scope);
      if (!scopedTarget) {
        // Dev warning — listener silently dropped when scope cannot resolve.
        // Skip attachment so we don't bind to the wrong target.
        console.warn(
          `[snice/@on] scope did not resolve for "${handler.eventName}" on ${handler.methodName} — listener skipped.`
        );
        continue;
      }
    }

    // Main event handler with error handling and event delegation
    if (handler.selector) {
      // Delegated event handling.
      // - Default eventRoot: shadow root if present, else host element.
      // - With explicit scope: attach to the scoped target instead.
      const eventRoot: EventTarget = hasExplicitTarget
        ? scopedTarget!
        : ((targetElement as any).shadowRoot || targetElement);

      const delegatedHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        const matchingElement =
          (target.matches && target.matches(handler.selector) && target) ||
          (target.closest && target.closest(handler.selector)) ||
          null;

        if (!matchingElement) return;

        if (handlerOptions.preventDefault) event.preventDefault();
        if (handlerOptions.stopPropagation) {
          event.stopPropagation();
          event.stopImmediatePropagation();
        }

        try {
          keyModifierMethod(event);
        } catch (error) {
          console.error(`Error in event handler ${handler.methodName}:`, error);
        }
      };

      // Auto-enable capture for non-bubbling events when using delegation
      const needsCapture = NON_BUBBLING_EVENTS.has(baseEventName);
      const useCapture = handlerOptions.capture !== undefined
        ? handlerOptions.capture
        : needsCapture;

      const listenerOptions: AddEventListenerOptions = {
        capture: useCapture,
        once: handlerOptions.once || false,
        passive: handlerOptions.passive || false,
      };

      eventRoot.addEventListener(baseEventName, delegatedHandler, listenerOptions);

      instance[CLEANUP].events.push({
        target: eventRoot,
        eventName: baseEventName,
        handler: delegatedHandler,
        options: listenerOptions,
      });
    } else {
      // Direct event handling.
      // - Default: shadow root + host element (so events inside shadow and on
      //   the host itself both fire). A per-handler Symbol dedupes.
      // - With explicit scope: attach to the scoped target ONLY (no duplication).
      const shadowRoot = hasExplicitTarget ? null : (targetElement as any).shadowRoot;

      // Per-handler private Symbol so dedup is scoped to THIS handler's two
      // listeners (shadowRoot + host). Using Symbol.for() with the method name
      // would collide across components that share a method name (e.g. a parent
      // and nested child both defining `handleClick`), causing the parent's
      // handler to be silently swallowed when events bubble up through a
      // shadow boundary.
      const handledSymbol = Symbol();

      const wrappedMethod = (event: Event) => {
        if ((event as any)[handledSymbol]) return;
        (event as any)[handledSymbol] = true;

        if (handlerOptions.preventDefault) event.preventDefault();
        if (handlerOptions.stopPropagation) event.stopPropagation();

        try {
          keyModifierMethod(event);
        } catch (error) {
          console.error(`Error in event handler ${handler.methodName}:`, error);
        }
      };

      const listenerOptions: AddEventListenerOptions = {
        capture: handlerOptions.capture || false,
        once: handlerOptions.once || false,
        passive: handlerOptions.passive || false,
      };

      if (hasExplicitTarget) {
        scopedTarget!.addEventListener(baseEventName, wrappedMethod as EventListener, listenerOptions);
        instance[CLEANUP].events.push({
          target: scopedTarget!,
          eventName: baseEventName,
          handler: wrappedMethod,
          options: listenerOptions,
        });
        continue;
      }

      if (shadowRoot) {
        // Listen on shadow root for events inside shadow DOM
        shadowRoot.addEventListener(baseEventName, wrappedMethod as EventListener, listenerOptions);
        instance[CLEANUP].events.push({
          target: shadowRoot,
          eventName: baseEventName,
          handler: wrappedMethod,
          options: listenerOptions,
        });
      }

      // Also listen on host element (for clicks on host itself or when no shadow root)
      targetElement.addEventListener(baseEventName, wrappedMethod as EventListener, listenerOptions);
      instance[CLEANUP].events.push({
        target: targetElement,
        eventName: baseEventName,
        handler: wrappedMethod,
        options: listenerOptions,
      });
    }
  }
}

/**
 * Cleanup event listeners for a controller instance
 * Called automatically by the controller system during detach
 */
export function cleanupEventHandlers(instance: any) {
  if (!instance[CLEANUP]?.events) return;

  for (const { target, eventName, handler, options } of instance[CLEANUP].events) {
    target.removeEventListener(eventName, handler, options);
  }

  instance[CLEANUP].events = [];
}
