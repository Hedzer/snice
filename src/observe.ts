import { OBSERVERS, CLEANUP, IS_CONTROLLER_INSTANCE } from './symbols';

export interface ObserveOptions {
  /** For IntersectionObserver: threshold of visibility */
  threshold?: number | number[];
  /** For IntersectionObserver: margin around root */
  rootMargin?: string;
  /** For IntersectionObserver: root element (defaults to viewport) */
  root?: Element | null;
  /** For ResizeObserver: which box model to observe */
  box?: 'content-box' | 'border-box';
  /** Throttle the callback by specified milliseconds */
  throttle?: number;
  /** For MutationObserver: observe subtree (use with caution) */
  subtree?: boolean;
  /** Maximum depth for subtree observation (safety limit) */
  maxDepth?: number;
}

interface ObserverMetadata {
  type: string;
  target: string;
  selector?: string;
  methodName: string;
  method: Function;
  options?: ObserveOptions;
}

// Global cache for MediaQueryList objects
const mediaQueryCache = new Map<string, MediaQueryList>();

// Global WeakMap to track observer instances for reuse
const intersectionObservers = new WeakMap<object, IntersectionObserver>();

/**
 * Decorator for observing external changes like viewport intersection, resize, media queries, and DOM mutations
 * 
 * @param target - The observation target (e.g., 'intersection', 'resize', 'media:(min-width: 768px)', 'mutation:childList') or array of targets
 * @param selectorOrOptions - CSS selector for element to observe OR options object
 * @param options - Options object (when second parameter is a selector)
 */
export function observe(observeTarget: string | string[], selectorOrOptions?: string | ObserveOptions, options?: ObserveOptions) {
  // Handle overloaded parameters
  let selector: string | undefined;
  let opts: ObserveOptions | undefined;
  
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

      // Store observer metadata
      if (!constructor.prototype[OBSERVERS]) {
        constructor.prototype[OBSERVERS] = [];
      }
      // Normalize to array
      const observeTargets = Array.isArray(observeTarget) ? observeTarget : [observeTarget];

      // Create an observer entry for each target
      for (const targetString of observeTargets) {
        // Parse the observation type from the observeTarget string
        const [type, ...modifiers] = targetString.split(':');

        constructor.prototype[OBSERVERS].push({
          type,
          target: modifiers.join(':'), // Rejoin for media queries or mutation types
          selector,
          methodName: propertyKey,
          method: target,
          options: opts
        });
      }
    });
  };
}

// Helper to setup observers for elements
export function setupObservers(instance: any, element: HTMLElement) {
  // Only check the prototype, not the instance itself to avoid property access issues
  const observers = instance.constructor.prototype[OBSERVERS];
  if (!observers || !Array.isArray(observers) || observers.length === 0) {
    return;
  }
  
  // Initialize cleanup object if needed
  if (!instance[CLEANUP]) {
    instance[CLEANUP] = { events: [], channels: [], observers: [] };
  } else if (!instance[CLEANUP].observers) {
    instance[CLEANUP].observers = [];
  }
  
  for (const observer of observers) {
    const method = observer.method.bind(instance);
    
    // Apply throttling if specified
    const callback = observer.options?.throttle 
      ? createThrottledCallback(method, observer.options.throttle)
      : method;
    
    switch (observer.type) {
      case 'intersection':
        setupIntersectionObserver(instance, element, observer, callback);
        break;
      case 'resize':
        setupResizeObserver(instance, element, observer, callback);
        break;
      case 'media':
        setupMediaQueryObserver(instance, element, observer, callback);
        break;
      case 'mutation':
        setupMutationObserver(instance, element, observer, callback);
        break;
      default:
        console.warn(`Unknown observer type: ${observer.type}`);
    }
  }
}

function setupIntersectionObserver(
  instance: any, 
  element: HTMLElement, 
  observer: ObserverMetadata, 
  callback: Function
) {
  const options: IntersectionObserverInit = {
    threshold: observer.options?.threshold ?? 0,
    rootMargin: observer.options?.rootMargin ?? '0px',
    root: observer.options?.root ?? null
  };
  
  // Create a key for reusing observers with same options
  const optionsKey = JSON.stringify(options);
  
  // Wrap callback to handle return value
  const wrappedCallback = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      try {
        const result = callback(entry);
        // If callback returns false, stop observing that element
        if (result === false && io) {
          io.unobserve(entry.target);
        }
      } catch (error) {
        console.error(`Error in intersection observer ${observer.methodName}:`, error);
      }
    }
  };
  
  // Check if IntersectionObserver is available
  if (typeof IntersectionObserver === 'undefined') {
    console.warn('IntersectionObserver is not available in this environment');
    return;
  }
  
  // Create or reuse IntersectionObserver
  let io = intersectionObservers.get({ instance, options: optionsKey });
  if (!io) {
    io = new IntersectionObserver(wrappedCallback, options);
    intersectionObservers.set({ instance, options: optionsKey }, io);
  }
  
  // Find target elements
  const targets = observer.selector 
    ? Array.from(element.shadowRoot?.querySelectorAll(observer.selector) || [])
    : [element];
  
  // Start observing
  targets.forEach(target => io!.observe(target));
  
  // Store cleanup
  instance[CLEANUP].observers.push(() => {
    targets.forEach(target => io!.unobserve(target));
    // Only disconnect if no more targets
    if (io!.takeRecords().length === 0) {
      io!.disconnect();
    }
  });
}

function setupResizeObserver(
  instance: any, 
  element: HTMLElement, 
  observer: ObserverMetadata, 
  callback: Function
) {
  const box = observer.options?.box || 'content-box';
  
  // Wrap callback with error handling
  const wrappedCallback = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      try {
        callback(entry);
      } catch (error) {
        console.error(`Error in resize observer ${observer.methodName}:`, error);
      }
    }
  };
  
  // Check if ResizeObserver is available
  if (typeof ResizeObserver === 'undefined') {
    console.warn('ResizeObserver is not available in this environment');
    return;
  }
  
  // Create ResizeObserver
  const ro = new ResizeObserver(wrappedCallback);
  
  // Find target elements
  const targets = observer.selector 
    ? Array.from(element.shadowRoot?.querySelectorAll(observer.selector) || [])
    : [element];
  
  // Start observing with options
  targets.forEach(target => {
    ro.observe(target, { box });
  });
  
  // Store cleanup
  instance[CLEANUP].observers.push(() => {
    ro.disconnect();
  });
}

function setupMediaQueryObserver(
  instance: any, 
  _element: HTMLElement, 
  observer: ObserverMetadata, 
  callback: Function
) {
  // Extract media query from target (e.g., "media:(min-width: 768px)" -> "(min-width: 768px)")
  const mediaQuery = observer.target;
  
  if (!mediaQuery) {
    console.warn('Media query observer requires a query string');
    return;
  }
  
  // Get or create MediaQueryList (cached globally)
  let mql = mediaQueryCache.get(mediaQuery);
  if (!mql) {
    try {
      mql = window.matchMedia(mediaQuery);
      mediaQueryCache.set(mediaQuery, mql);
    } catch (error) {
      console.error(`Invalid media query: ${mediaQuery}`, error);
      return;
    }
  }
  
  // Wrap callback with error handling
  const wrappedCallback = (event: MediaQueryListEvent | MediaQueryList) => {
    try {
      callback('matches' in event ? event.matches : (event as MediaQueryListEvent).matches);
    } catch (error) {
      console.error(`Error in media query observer ${observer.methodName}:`, error);
    }
  };
  
  // Call immediately with current state
  wrappedCallback(mql);
  
  // Listen for changes
  const changeHandler = (e: MediaQueryListEvent) => wrappedCallback(e);
  
  // Modern browsers use addEventListener
  if (mql.addEventListener) {
    mql.addEventListener('change', changeHandler);
    instance[CLEANUP].observers.push(() => {
      mql!.removeEventListener('change', changeHandler);
    });
  } else {
    // Fallback for older browsers
    mql.addListener(changeHandler);
    instance[CLEANUP].observers.push(() => {
      mql!.removeListener(changeHandler);
    });
  }
}

function setupMutationObserver(
  instance: any, 
  element: HTMLElement, 
  observer: ObserverMetadata, 
  callback: Function
) {
  // Parse mutation type and attribute from target
  // e.g., "childList", "attributes:class", "attributes:data-state"
  const parts = observer.target.split(':');
  const mutationType = parts[0] || 'childList';
  const attributeName = parts[1];
  
  // Build MutationObserver options
  const options: MutationObserverInit = {};
  
  switch (mutationType) {
    case 'childList':
      options.childList = true;
      break;
    case 'attributes':
      options.attributes = true;
      if (attributeName) {
        options.attributeFilter = [attributeName];
      }
      break;
    default:
      console.warn(`Unknown mutation type: ${mutationType}`);
      return;
  }
  
  // Apply subtree with safety limits
  if (observer.options?.subtree) {
    options.subtree = true;
    // Could implement maxDepth checking in the callback
    if (observer.options.maxDepth) {
      console.warn('maxDepth is set but requires custom implementation');
    }
  }
  
  // Wrap callback with error handling
  const wrappedCallback = (mutations: MutationRecord[]) => {
    try {
      // Filter mutations if maxDepth is specified (simplified version)
      if (observer.options?.maxDepth && observer.options.subtree) {
        const maxDepth = observer.options!.maxDepth!;
        const filtered = mutations.filter(mutation => {
          // Simple depth check (could be more sophisticated)
          let depth = 0;
          let current = mutation.target as Node;
          const root = element.shadowRoot || element;
          while (current && current !== root && depth < maxDepth) {
            current = current.parentNode!;
            depth++;
          }
          return depth < maxDepth;
        });
        if (filtered.length > 0) {
          callback(filtered);
        }
      } else {
        callback(mutations);
      }
    } catch (error) {
      console.error(`Error in mutation observer ${observer.methodName}:`, error);
    }
  };
  
  // Create MutationObserver
  const mo = new MutationObserver(wrappedCallback);
  
  // Find target elements
  const isController = instance[IS_CONTROLLER_INSTANCE] === true;
  
  // For mutation observers without selector:
  // - Controllers: observe the shadow DOM of the element they're attached to (if it exists)
  // - Elements: observe the element itself (light DOM) to avoid infinite loops
  const targets = observer.selector 
    ? Array.from(element.shadowRoot?.querySelectorAll(observer.selector) || [])
    : isController && element.shadowRoot 
      ? [element.shadowRoot]
      : [element];
  
  // Start observing
  targets.forEach(target => {
    mo.observe(target, options);
  });
  
  // Store cleanup
  instance[CLEANUP].observers.push(() => {
    mo.disconnect();
  });
}

function createThrottledCallback(callback: Function, delay: number): Function {
  let lastCall = 0;
  let timeout: any = null;
  
  return function(this: any, ...args: any[]) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    
    if (remaining <= 0) {
      // Enough time has passed, execute immediately
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      return callback.apply(this, args);
    } else if (!timeout) {
      // Schedule for later
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        callback.apply(this, args);
      }, remaining);
    }
  };
}

// Helper to cleanup observers
export function cleanupObservers(instance: any) {
  if (instance[CLEANUP]?.observers) {
    for (const cleanup of instance[CLEANUP].observers) {
      cleanup();
    }
    instance[CLEANUP].observers = [];
  }
}