/**
 * @on decorator for listening to events
 * Use in elements or controllers to listen to DOM events or custom events
 */

import { CLEANUP } from './symbols';
import { getSymbol } from './symbols';
import type { OnOptions } from './types/on-options';
import { parseKeyboardFilter, matchesKeyboardFilter, type KeyboardFilter } from './parts';

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
    // With selector: (eventName, selector, options)
    selector = selectorOrOptions;
    opts = options || {};
  } else if (selectorOrOptions === null && options) {
    // With null selector: (eventName, null, options)
    opts = options;
  } else if (selectorOrOptions && typeof selectorOrOptions === 'object') {
    // Without selector: (eventName, options)
    opts = selectorOrOptions;
  }

  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;
    const initKey = `__on_init_${methodName}_${selector || ''}_${JSON.stringify(eventName)}`;

    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      // Only initialize once per class, not per instance
      if (constructor[initKey]) return;
      constructor[initKey] = true;

      if (!constructor[ON_HANDLERS]) {
        constructor[ON_HANDLERS] = [];
      }

      const eventNames = Array.isArray(eventName) ? eventName : [eventName];

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

/**
 * Create a debounced version of a function
 */
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: any[]) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  } as T;
}

/**
 * Create a throttled version of a function (leading edge only)
 */
function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let lastCall = 0;

  return function (this: any, ...args: any[]) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
    // Events within the throttle window are simply ignored (leading edge only)
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
export function setupEventHandlers(instance: any, targetElement: HTMLElement) {
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
    const dotIndex = handler.eventName.indexOf('.');
    const colonIndex = handler.eventName.indexOf(':');

    const delimiterIndex = dotIndex > 0 && colonIndex > 0
      ? Math.min(dotIndex, colonIndex)
      : Math.max(dotIndex, colonIndex);

    const baseEventName = delimiterIndex > 0
      ? handler.eventName.substring(0, delimiterIndex)
      : handler.eventName;

    const keyModifier = delimiterIndex > 0
      ? handler.eventName.substring(delimiterIndex + 1)
      : null;

    // Apply debounce if specified
    if (handlerOptions.debounce && handlerOptions.debounce > 0) {
      boundMethod = debounce(boundMethod, handlerOptions.debounce);
    }

    // Apply throttle if specified (debounce takes precedence)
    else if (handlerOptions.throttle && handlerOptions.throttle > 0) {
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

    // Main event handler with error handling and event delegation
    if (handler.selector) {
      // Delegated event handling - use shadow root if available
      const eventRoot = (targetElement as any).shadowRoot || targetElement;

      const delegatedHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        let matchingElement: Element | null = null;

        // Check if target itself matches the selector
        if (target.matches && target.matches(handler.selector)) {
          matchingElement = target;
        }
        // Check if any parent matches the selector (event delegation)
        else if (target.closest) {
          matchingElement = target.closest(handler.selector);
        }

        // Only handle if we found a match
        // Note: No need to check contains() since the event bubbled to eventRoot
        if (matchingElement) {
          // Apply automatic preventDefault/stopPropagation
          if (handlerOptions.preventDefault) {
            event.preventDefault();
          }
          if (handlerOptions.stopPropagation) {
            event.stopPropagation();
            event.stopImmediatePropagation();
          }

          try {
            keyModifierMethod(event);
          } catch (error) {
            console.error(`Error in event handler ${handler.methodName}:`, error);
          }
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
      // Direct event handling - on the element itself
      const wrappedMethod = (event: Event) => {
        try {
          // Apply automatic preventDefault/stopPropagation
          if (handlerOptions.preventDefault) {
            event.preventDefault();
          }
          if (handlerOptions.stopPropagation) {
            event.stopPropagation();
          }

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
