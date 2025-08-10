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