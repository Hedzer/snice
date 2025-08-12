const ON_HANDLERS = Symbol('on-handlers');

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
  
  // Store cleanup functions
  if (!instance._eventCleanup) {
    instance._eventCleanup = [];
  }
  
  for (const handler of handlers) {
    const originalMethod = handler.method.bind(instance);
    
    // Wrap boundMethod in try-catch for error isolation
    const boundMethod = (event: Event) => {
      try {
        return originalMethod(event);
      } catch (error) {
        console.error(`Error in event handler ${handler.methodName}:`, error);
        // Don't rethrow - allow other handlers to continue
      }
    };
    
    if (handler.selector) {
      // Delegated event handling - use shadow root if available
      const eventRoot = element.shadowRoot || element;
      const delegatedHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target.matches && target.matches(handler.selector)) {
          boundMethod(event);
        } else if (target.closest) {
          const closest = target.closest(handler.selector);
          if (closest) {
            boundMethod(event);
          }
        }
      };
      
      eventRoot.addEventListener(handler.eventName, delegatedHandler);
      instance._eventCleanup.push(() => {
        eventRoot.removeEventListener(handler.eventName, delegatedHandler);
      });
    } else {
      // Direct event handling - always on the element itself
      element.addEventListener(handler.eventName, boundMethod);
      instance._eventCleanup.push(() => {
        element.removeEventListener(handler.eventName, boundMethod);
      });
    }
  }
}

// Helper to cleanup event handlers
export function cleanupEventHandlers(instance: any) {
  if (instance._eventCleanup) {
    for (const cleanup of instance._eventCleanup) {
      cleanup();
    }
    instance._eventCleanup = [];
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
        ...options,     // Spread all EventInit options
        detail: result
      });
      
      this.dispatchEvent(event);
      
      return result;
    };
    
    return descriptor;
  };
}