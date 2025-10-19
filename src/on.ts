/**
 * @on decorator for listening to events
 * Use in controllers or elements to listen to DOM events or custom events
 */

import { CLEANUP } from './symbols';
import { getSymbol } from './symbols';

const ON_HANDLERS = getSymbol('on-handlers');

export interface OnOptions {
  /** Use capture phase instead of bubble phase */
  capture?: boolean;
  /** Remove listener after first trigger */
  once?: boolean;
  /** Passive listener (can't preventDefault) */
  passive?: boolean;
}

/**
 * @on decorator for listening to events
 *
 * Use this in controllers to listen to custom events or DOM events
 *
 * @param eventName - Event name(s) to listen for
 * @param options - Event listener options
 *
 * @example
 * ```typescript
 * @controller('my-controller')
 * class MyController {
 *   element!: HTMLElement;
 *
 *   @on('count-changed')
 *   handleCountChanged(e: CustomEvent) {
 *     console.log('Count changed to:', e.detail.count);
 *   }
 *
 *   @on(['click', 'keydown'])
 *   handleInteraction(e: Event) {
 *     console.log('User interacted');
 *   }
 * }
 * ```
 */
export function on(eventName: string | string[], options?: OnOptions) {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    context.addInitializer(function (this: any) {
      const constructor = this.constructor as any;

      // Store listener metadata
      if (!constructor.prototype[ON_HANDLERS]) {
        constructor.prototype[ON_HANDLERS] = [];
      }

      // Normalize to array
      const eventNames = Array.isArray(eventName) ? eventName : [eventName];

      // Create a handler entry for each event
      for (const event of eventNames) {
        constructor.prototype[ON_HANDLERS].push({
          eventName: event,
          methodName,
          method: originalMethod,
          options: options || {},
        });
      }
    });

    return originalMethod;
  };
}

/**
 * Setup event listeners for a controller instance
 * Called automatically by the controller system during attach
 */
export function setupEventHandlers(instance: any, element: HTMLElement) {
  const handlers = instance.constructor.prototype[ON_HANDLERS];
  if (!handlers || !Array.isArray(handlers) || handlers.length === 0) {
    return;
  }

  // Initialize cleanup object if needed
  if (!instance[CLEANUP]) {
    instance[CLEANUP] = { events: [], channels: [], observers: [] };
  } else if (!instance[CLEANUP].events) {
    instance[CLEANUP].events = [];
  }

  for (const handler of handlers) {
    const method = handler.method.bind(instance);
    const listenerOptions: AddEventListenerOptions = {
      capture: handler.options.capture,
      once: handler.options.once,
      passive: handler.options.passive,
    };

    // Add listener to the controller's host element
    element.addEventListener(handler.eventName, method, listenerOptions);

    // Track for cleanup
    instance[CLEANUP].events.push({
      target: element,
      eventName: handler.eventName,
      handler: method,
      options: listenerOptions,
    });
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
