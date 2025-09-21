import { ON_HANDLERS, CLEANUP, DISPATCH_TIMERS } from './symbols';
import { OnOptions } from './types/on-options';
import { DispatchOptions } from './types/dispatch-options';


export function on(eventName: string | string[], selectorOrOptions?: string | OnOptions, options?: OnOptions) {
  // Handle overloaded parameters
  let selector: string | undefined;
  let opts: OnOptions | undefined;
  
  if (typeof selectorOrOptions === 'string') {
    selector = selectorOrOptions;
    opts = options;
  } else {
    selector = undefined;
    opts = selectorOrOptions;
  }
  
  return function (target: any, context: ClassMethodDecoratorContext) {
    const propertyKey = context.name as string;

    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      // Store event handler metadata
      if (!constructor.prototype[ON_HANDLERS]) {
        constructor.prototype[ON_HANDLERS] = [];
      }

      // Normalize to array and expand at decoration time
      const eventNames = Array.isArray(eventName) ? eventName : [eventName];

      // Create a handler entry for each event
      for (const event of eventNames) {
        constructor.prototype[ON_HANDLERS].push({
          eventName: event,
          selector,
          methodName: propertyKey,
          method: target,
          options: opts
        });
      }
    });
  };
}

// Helper to setup event handlers for elements
export function setupEventHandlers(instance: any, element: HTMLElement) {
  const handlers = instance.constructor.prototype[ON_HANDLERS];
  if (!handlers) return;
  
  // Initialize cleanup object if needed
  if (!instance[CLEANUP]) {
    instance[CLEANUP] = { events: [], channels: [] };
  }
  
  for (const handler of handlers) {
    // Get the current method from the instance (preserves decorator stacking)
    const currentMethod = (instance as any)[handler.method.name];
    const originalMethod = currentMethod ? currentMethod.bind(instance) : handler.method.bind(instance);
    const handlerOptions = handler.options || {};
    
    // Parse event name for key modifiers
    const [baseEventName, keyModifier] = handler.eventName.split(':');
    
    // Create debounced/throttled wrapper if needed
    const createTimedWrapper = (method: Function): Function => {
      if (handlerOptions.debounce) {
        let timeoutId: any;
        return function(this: any, ...args: any[]) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => method.apply(this, args), handlerOptions.debounce);
        };
      }
      
      if (handlerOptions.throttle) {
        let lastCall = 0;
        let timeoutId: any;
        return function(this: any, ...args: any[]) {
          const now = Date.now();
          const remaining = handlerOptions.throttle! - (now - lastCall);
          
          if (remaining <= 0) {
            clearTimeout(timeoutId);
            lastCall = now;
            method.apply(this, args);
          } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
              lastCall = Date.now();
              timeoutId = null;
              method.apply(this, args);
            }, remaining);
          }
        };
      }
      
      return method;
    };
    
    // Create the event handler with key modifier support
    const createEventHandler = (method: Function) => {
      if (keyModifier && (baseEventName === 'keydown' || baseEventName === 'keyup' || baseEventName === 'keypress')) {
        return (event: Event) => {
          const keyEvent = event as KeyboardEvent;
          
          // Helper to normalize key names (e.g., "Space" -> " ")
          const normalizeKey = (key: string): string => {
            if (key === 'Space') return ' ';
            return key;
          };
          
          // Check for "any modifiers" match with ~ prefix
          if (keyModifier.startsWith('~')) {
            const key = normalizeKey(keyModifier.slice(1)); // Remove the ~ and normalize
            // Match if key matches, regardless of modifiers
            if (keyEvent.key === key) {
              method(event);
            }
            return;
          }
          
          // Check for modifier combinations using +
          if (keyModifier.includes('+')) {
            const parts = keyModifier.split('+');
            const key = normalizeKey(parts[parts.length - 1]); // Last part is the actual key
            const modifiers = parts.slice(0, -1); // Everything else is modifiers
            
            // Check the actual key
            if (keyEvent.key !== key) return;
            
            // Create a set of expected modifiers
            const expectedModifiers = new Set(modifiers.map((m: string) => m.toLowerCase()));
            const hasCtrl = expectedModifiers.has('ctrl');
            const hasShift = expectedModifiers.has('shift');
            const hasAlt = expectedModifiers.has('alt');
            const hasMeta = expectedModifiers.has('meta') || expectedModifiers.has('cmd');
            
            // Check that expected modifiers are pressed and unexpected ones are not
            const modifiersMatch = 
              keyEvent.ctrlKey === hasCtrl &&
              keyEvent.shiftKey === hasShift &&
              keyEvent.altKey === hasAlt &&
              keyEvent.metaKey === hasMeta;
            
            if (modifiersMatch) {
              method(event);
            }
          } else {
            // Default: exact match (no modifiers allowed)
            const key = normalizeKey(keyModifier);
            // Only match if key matches AND no modifiers are pressed
            if (keyEvent.key === key && 
                !keyEvent.ctrlKey && 
                !keyEvent.shiftKey && 
                !keyEvent.altKey && 
                !keyEvent.metaKey) {
              method(event);
            }
          }
        };
      }
      return method;
    };
    
    // Apply timing wrapper (debounce/throttle)
    const timedMethod = createTimedWrapper(originalMethod);
    
    // Wrap boundMethod in try-catch for error isolation
    const wrappedMethod = createEventHandler((event: Event) => {
      try {
        // Apply automatic preventDefault/stopPropagation if configured
        if (handlerOptions.preventDefault) {
          event.preventDefault();
        }
        if (handlerOptions.stopPropagation) {
          event.stopPropagation();
        }
        
        return timedMethod(event);
      } catch (error) {
        console.error(`Error in event handler ${handler.methodName}:`, error);
        // Don't rethrow - allow other handlers to continue
      }
    });
    
    if (handler.selector) {
      // Delegated event handling - use shadow root if available
      const eventRoot = element.shadowRoot || element;
      const delegatedHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        let shouldHandle = false;
        
        if (target.matches && target.matches(handler.selector)) {
          shouldHandle = true;
        } else if (target.closest) {
          const closest = target.closest(handler.selector);
          if (closest) {
            shouldHandle = true;
          }
        }
        
        if (shouldHandle) {
          // Apply automatic preventDefault/stopPropagation only if we're handling this event
          if (handlerOptions.preventDefault) {
            event.preventDefault();
          }
          if (handlerOptions.stopPropagation) {
            event.stopPropagation();
            event.stopImmediatePropagation(); // Also stop other handlers on same element
          }
          
          wrappedMethod(event);
        }
      };
      
      const listenerOptions: AddEventListenerOptions = {
        capture: handlerOptions.capture || false,
        once: handlerOptions.once || false,
        passive: handlerOptions.passive || false
      };
      
      eventRoot.addEventListener(baseEventName, delegatedHandler, listenerOptions);
      instance[CLEANUP].events.push(() => {
        eventRoot.removeEventListener(baseEventName, delegatedHandler, listenerOptions);
      });
    } else {
      // Direct event handling - always on the element itself
      const listenerOptions: AddEventListenerOptions = {
        capture: handlerOptions.capture || false,
        once: handlerOptions.once || false,
        passive: handlerOptions.passive || false
      };
      
      element.addEventListener(baseEventName, wrappedMethod as EventListener, listenerOptions);
      instance[CLEANUP].events.push(() => {
        element.removeEventListener(baseEventName, wrappedMethod as EventListener, listenerOptions);
      });
    }
  }
}

// Helper to cleanup event handlers
export function cleanupEventHandlers(instance: any) {
  if (instance[CLEANUP]?.events) {
    for (const cleanup of instance[CLEANUP].events) {
      cleanup();
    }
    instance[CLEANUP].events = [];
  }
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