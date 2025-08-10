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
export function setupEventHandlers(instance: any, root: HTMLElement) {
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
      // Delegated event handling
      const delegatedHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target.matches(handler.selector) || target.closest(handler.selector)) {
          boundMethod(event);
        }
      };
      
      root.addEventListener(handler.eventName, delegatedHandler);
      instance._eventCleanup.push(() => {
        root.removeEventListener(handler.eventName, delegatedHandler);
      });
    } else {
      // Direct event handling
      root.addEventListener(handler.eventName, boundMethod);
      instance._eventCleanup.push(() => {
        root.removeEventListener(handler.eventName, boundMethod);
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