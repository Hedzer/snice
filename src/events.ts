import { ON_HANDLERS, CLEANUP } from './symbols';

export function on(eventName: string, selector?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store event handler metadata
    if (!target[ON_HANDLERS]) {
      target[ON_HANDLERS] = [];
    }
    
    target[ON_HANDLERS].push({
      eventName,
      selector,
      methodName: propertyKey,
      method: descriptor.value
    });
    
    return descriptor;
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
    const originalMethod = handler.method.bind(instance);
    
    // Parse event name for key modifiers
    const [baseEventName, keyModifier] = handler.eventName.split(':');
    
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
    
    // Wrap boundMethod in try-catch for error isolation
    const wrappedMethod = createEventHandler((event: Event) => {
      try {
        return originalMethod(event);
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
        if (target.matches && target.matches(handler.selector)) {
          wrappedMethod(event);
        } else if (target.closest) {
          const closest = target.closest(handler.selector);
          if (closest) {
            wrappedMethod(event);
          }
        }
      };
      
      eventRoot.addEventListener(baseEventName, delegatedHandler);
      instance[CLEANUP].events.push(() => {
        eventRoot.removeEventListener(baseEventName, delegatedHandler);
      });
    } else {
      // Direct event handling - always on the element itself
      element.addEventListener(baseEventName, wrappedMethod as EventListener);
      instance[CLEANUP].events.push(() => {
        element.removeEventListener(baseEventName, wrappedMethod as EventListener);
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

export interface DispatchOptions extends EventInit {
  /**
   * Whether to dispatch even if the method returns undefined (default: true)
   */
  dispatchOnUndefined?: boolean;
}

/**
 * Decorator that automatically dispatches a custom event after a method is called.
 * The return value of the method becomes the event detail.
 * 
 * @param eventName The name of the event to dispatch
 * @param options Optional configuration extending EventInit
 */
export function dispatch(eventName: string, options?: DispatchOptions) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (this: HTMLElement, ...args: any[]) {
      // Call the original method
      const result = originalMethod.apply(this, args);
      
      // Handle async methods
      if (result instanceof Promise) {
        return result.then((resolvedResult: any) => {
          // Skip dispatch if result is undefined and dispatchOnUndefined is false
          if (resolvedResult === undefined && options?.dispatchOnUndefined === false) {
            return resolvedResult;
          }
          
          // Create event with spread operator for options
          const event = new CustomEvent(eventName, {
            bubbles: true,  // Default to true for component events
            composed: true, // Allow crossing shadow DOM boundaries
            ...options,     // Spread all EventInit options
            detail: resolvedResult
          });
          
          this.dispatchEvent(event);
          return resolvedResult;
        });
      }
      
      // Skip dispatch if result is undefined and dispatchOnUndefined is false
      if (result === undefined && options?.dispatchOnUndefined === false) {
        return result;
      }
      
      // Create event with spread operator for options
      const event = new CustomEvent(eventName, {
        bubbles: true,  // Default to true for component events
        composed: true, // Allow crossing shadow DOM boundaries
        ...options,     // Spread all EventInit options
        detail: result
      });
      
      this.dispatchEvent(event);
      
      return result;
    };
    
    return descriptor;
  };
}