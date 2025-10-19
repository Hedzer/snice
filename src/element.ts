import { attachController, detachController } from './controller';
import { setupObservers, cleanupObservers } from './observe';
import { setupResponseHandlers, cleanupResponseHandlers } from './request-response';
import { parseAttributeValue, detectType, valueToAttribute } from './utils';
import { requestRender, applyStyles } from './render';
import { IS_ELEMENT_CLASS, IS_CONTROLLER_INSTANCE, READY_PROMISE, READY_RESOLVE, CONTROLLER, PROPERTIES, PROPERTY_VALUES, PROPERTIES_INITIALIZED, PROPERTY_WATCHERS, EXPLICITLY_SET_PROPERTIES, ROUTER_CONTEXT, READY_HANDLERS, DISPOSE_HANDLERS, INITIALIZED, MOVED_HANDLERS, ADOPTED_HANDLERS, MOVED_TIMERS, ADOPTED_TIMERS, RENDER_METHOD } from './symbols';
import { QueryOptions } from './types/query-options';
import { PropertyOptions } from './types/property-options';
import { MovedOptions } from './types/moved-options';
import { AdoptedOptions } from './types/adopted-options';
import { AppContext } from './types/app-context';
import { Placard } from './types/placard';
import { RouteParams } from './types/route-params';

/**
 * Interface that layout components must implement to receive updates
 * from the router about application state and navigation changes.
 *
 * The framework will call the update method:
 * - When the layout is first created/connected
 * - When route changes occur during navigation
 *
 * Placards are collected at route creation and refreshed before each navigation,
 * ensuring layouts always receive current page metadata.
 *
 * @example
 * ```typescript
 * @layout('app-shell')
 * class AppShell extends HTMLElement implements Layout {
 *   update(appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams) {
 *     // Update navigation, breadcrumbs, user info, etc.
 *     this.renderNavigation(placards, currentRoute);
 *     this.updateUserInfo(appContext.principal);
 *     this.applyTheme(appContext.theme);
 *   }
 * }
 * ```
 */
export interface Layout {
  /**
   * Called by the framework to update the layout with current application state.
   *
   * @param appContext - Application-wide context (theme, auth, config, etc.)
   * @param placards - All page metadata for navigation and breadcrumbs
   * @param currentRoute - The currently active route path
   * @param routeParams - Parameters extracted from the current route
   *
   * @example
   * ```typescript
   * update(appContext, placards, currentRoute, routeParams) {
   *   // Filter placards for main navigation
   *   const navItems = placards.filter(p => p.show !== false && !p.parent);
   *
   *   // Build breadcrumbs for current page
   *   const currentPlacard = placards.find(p => matchesRoute(p, currentRoute));
   *   const breadcrumbs = this.buildBreadcrumbs(currentPlacard, placards);
   *
   *   // Update UI
   *   this.renderNavigation(navItems, currentRoute);
   *   this.renderBreadcrumbs(breadcrumbs);
   *   this.updateUserDisplay(appContext.principal);
   * }
   * ```
   */
  update(
    appContext: AppContext,
    placards: Placard[],
    currentRoute: string,
    routeParams: RouteParams
  ): void;
}

/**
 * Applies core element functionality to a constructor
 * This is shared between @element and @page decorators
 */
export function applyElementFunctionality(constructor: any) {
  // Mark as element class for channel decorator detection
  (constructor.prototype as any)[IS_ELEMENT_CLASS] = true;
    
    // Add controller property to all elements
    const originalConnectedCallback = constructor.prototype.connectedCallback;
    const originalDisconnectedCallback = constructor.prototype.disconnectedCallback;
    const originalAttributeChangedCallback = constructor.prototype.attributeChangedCallback;
    
    // Add 'controller' and all reflected properties to observed attributes
    const observedAttributes = constructor.observedAttributes || [];
    if (!observedAttributes.includes('controller')) {
      observedAttributes.push('controller');
    }
    
    // Add all properties to observed attributes (not just reflected ones)
    const properties = constructor[PROPERTIES];
    if (properties) {
      for (const [propName, propOptions] of properties) {
        const attributeName = typeof propOptions.attribute === 'string' ? propOptions.attribute : propName.toLowerCase();
        if (!observedAttributes.includes(attributeName)) {
          observedAttributes.push(attributeName);
        }
      }
    }
    
    Object.defineProperty(constructor, 'observedAttributes', {
      get() { return observedAttributes; },
      configurable: true
    });
    
    // Add ready property - always returns a promise
    Object.defineProperty(constructor.prototype, 'ready', {
      get() {
        if (!this[READY_PROMISE]) {
          // Create a pending promise if not yet initialized
          this[READY_PROMISE] = new Promise<void>((resolve) => {
            this[READY_RESOLVE] = resolve;
          });
        }
        return this[READY_PROMISE];
      },
      enumerable: true,
      configurable: true
    });
    
    // Add controller property
    Object.defineProperty(constructor.prototype, 'controller', {
      get() {
        return this[CONTROLLER];
      },
      set(value: string) {
        const oldValue = this[CONTROLLER];
        this[CONTROLLER] = value;
        if (value !== oldValue && value) {
          // Attach controller asynchronously
          attachController(this, value).catch(error => {
            console.error(`Failed to attach controller "${value}":`, error);
          });
        } else if (!value && oldValue) {
          // Detach controller asynchronously
          detachController(this).catch(error => {
            console.error(`Failed to detach controller:`, error);
          });
        }
      },
      enumerable: true,
      configurable: true
    });
    
    
    constructor.prototype.connectedCallback = async function() {
      // If ready promise was already created (controller attached before connected), use existing resolve
      // Otherwise create the ready promise now
      if (!this[READY_PROMISE]) {
        this[READY_PROMISE] = new Promise<void>((resolve) => {
          this[READY_RESOLVE] = resolve;
        });
      }

      // Only run initialization logic once, but re-establish handlers on reconnection
      if (this[INITIALIZED]) {
        // Re-establish handlers that get cleaned up on disconnect
        setupResponseHandlers(this, this);

        // Re-establish observers that get cleaned up on disconnect
        try {
          setupObservers(this, this);
        } catch (error) {
          console.error(`Error setting up observers for ${this.tagName} on reconnection:`, error);
        }

        // Call user's connectedCallback
        if (originalConnectedCallback) {
          originalConnectedCallback.call(this);
        }
        return;
      }

      try {
        // Initialize properties from attributes before rendering
        const properties = constructor[PROPERTIES];
        if (properties) {
          for (const [propName, propOptions] of properties) {
            // Check for attribute using proper attribute name
            const attributeName = typeof propOptions.attribute === 'string' ? propOptions.attribute : propName.toLowerCase();
            if (this.hasAttribute(attributeName)) {
              // Attribute exists, parse and set the property value
              const attrValue = this.getAttribute(attributeName);

              // Mark as explicitly set since it came from an attribute
              if (!this[EXPLICITLY_SET_PROPERTIES]) {
                this[EXPLICITLY_SET_PROPERTIES] = new Set();
              }
              this[EXPLICITLY_SET_PROPERTIES].add(propName);

              this[propName] = parseAttributeValue(attrValue, propOptions);
            }
          }
        }
        
        // Mark that properties have been initialized
        this[PROPERTIES_INITIALIZED] = true;

        // Properties are now stateless and read from DOM attributes only
        // Initial values are not automatically reflected

        // v3.0.0: Apply @styles decorator if present
        // This creates the shadow root and applies styles
        applyStyles(this);

        // v3.0.0: Perform initial @render if present
        // This uses differential rendering with template system
        // Defer initial render to next microtask to allow property bindings
        // from parent to be set first (avoids infinite loops in nested elements)
        if (this[RENDER_METHOD]) {
          queueMicrotask(() => requestRender(this, true));
        }

        // Setup @respond handlers for elements
        setupResponseHandlers(this, this);

        // Setup @observe observers
        try {
          setupObservers(this, this);
        } catch (error) {
          console.error(`Error setting up observers for ${this.tagName}:`, error);
        }

        // Mark as initialized
        this[INITIALIZED] = true;

        // NOW call the original user-defined connectedCallback after shadow DOM is set up
        if (originalConnectedCallback) {
          originalConnectedCallback.call(this);
        }
      } finally {
        // Always mark element as ready, even if there were errors
        if (this[READY_RESOLVE]) {
          this[READY_RESOLVE]();
          this[READY_RESOLVE] = null; // Clear the resolver
        }
      }

      // Call @ready handlers after everything is set up and ready promise is resolved
      const readyHandlers = constructor[READY_HANDLERS];
      if (readyHandlers) {
        for (const handler of readyHandlers) {
          try {
            await handler.method.call(this);
          } catch (error) {
            console.error(`Error in @ready handler ${handler.methodName}:`, error);
          }
        }
      }
    };
    
    constructor.prototype.disconnectedCallback = async function() {
      // Call @dispose handlers
      const disposeHandlers = constructor[DISPOSE_HANDLERS];
      if (disposeHandlers) {
        for (const handler of disposeHandlers) {
          try {
            await handler.method.call(this);
          } catch (error) {
            console.error(`Error in @dispose handler ${handler.methodName}:`, error);
          }
        }
      }
      
      // Call original user-defined disconnectedCallback
      if (originalDisconnectedCallback) {
        originalDisconnectedCallback.call(this);
      }
      if (this[CONTROLLER]) {
        detachController(this).catch(error => {
          console.error(`Failed to detach controller:`, error);
        });
      }
      // Cleanup @respond handlers
      cleanupResponseHandlers(this);
      // Cleanup @observe observers
      cleanupObservers(this);
    };
    
    constructor.prototype.attributeChangedCallback = function(name: string, oldValue: string, newValue: string) {
      originalAttributeChangedCallback?.call(this, name, oldValue, newValue);
      if (name === 'controller') {
        this.controller = newValue;
      } else {
        // Handle all properties (not just reflected ones)
        const properties = constructor[PROPERTIES];
        if (properties) {
          for (const [propName, propOptions] of properties) {
            const attributeName = typeof propOptions.attribute === 'string' ? propOptions.attribute : propName.toLowerCase();
            if (attributeName.toLowerCase() === name.toLowerCase()) {
              // Check if the current property value already matches to avoid feedback loops
              const currentValue = this[PROPERTY_VALUES]?.[propName];
              
              // Parse the new value based on type
              const parsedValue = parseAttributeValue(newValue, propOptions, currentValue, undefined);
              
              // Only update if the value actually changed and avoid infinite loops
              if (currentValue !== parsedValue) {
                // Mark as explicitly set since it came from an attribute change
                if (!this[EXPLICITLY_SET_PROPERTIES]) {
                  this[EXPLICITLY_SET_PROPERTIES] = new Set();
                }
                this[EXPLICITLY_SET_PROPERTIES].add(propName);

                // Set the property value directly in the storage to avoid triggering setter
                if (!this[PROPERTY_VALUES]) {
                  this[PROPERTY_VALUES] = {};
                }
                this[PROPERTY_VALUES][propName] = parsedValue;

                // Only call watchers if this attribute change didn't originate from a property setter
                const isFromPropertySetter = this._settingFromProperty?.has(name.toLowerCase());
                if (!isFromPropertySetter) {
                  // Call watchers manually since we bypassed the setter
                  const watchers = constructor[PROPERTY_WATCHERS];
                  if (watchers) {
                    // Call specific property watchers
                    if (watchers.has(propName)) {
                      const propertyWatchers = watchers.get(propName);
                      for (const watcher of propertyWatchers) {
                        try {
                          watcher.method.call(this, currentValue, parsedValue, propName);
                        } catch (error) {
                          console.error(`Error in @watch('${propName}') method ${watcher.methodName}:`, error);
                        }
                      }
                    }

                    // Call wildcard watchers (watching "*")
                    if (watchers.has('*')) {
                      const wildcardWatchers = watchers.get('*');
                      for (const watcher of wildcardWatchers) {
                        try {
                          watcher.method.call(this, currentValue, parsedValue, propName);
                        } catch (error) {
                          console.error(`Error in @watch('*') method ${watcher.methodName}:`, error);
                        }
                      }
                    }
                  }
                }
              }
              break;
            }
          }
        }
      }
    };

    // Add connectedMoveCallback for handling DOM moves
    constructor.prototype.connectedMoveCallback = async function() {
      // Call @moved handlers
      const movedHandlers = constructor[MOVED_HANDLERS];
      if (movedHandlers) {
        for (const handler of movedHandlers) {
          try {
            await handler.method.call(this);
          } catch (error) {
            console.error(`Error in @moved handler ${handler.methodName}:`, error);
          }
        }
      }
    };

    // Add adoptedCallback for handling document adoption
    constructor.prototype.adoptedCallback = async function() {
      // Call @adopted handlers
      const adoptedHandlers = constructor[ADOPTED_HANDLERS];
      if (adoptedHandlers) {
        for (const handler of adoptedHandlers) {
          try {
            await handler.method.call(this);
          } catch (error) {
            console.error(`Error in @adopted handler ${handler.methodName}:`, error);
          }
        }
      }
    };
}

export function element(tagName: string) {
  return function (constructor: any, context: ClassDecoratorContext) {
    // Transfer metadata from context to constructor
    if (context.metadata && (context.metadata as any)[PROPERTIES]) {
      if (!constructor[PROPERTIES]) {
        constructor[PROPERTIES] = new Map();
      }
      for (const [key, value] of (context.metadata as any)[PROPERTIES]) {
        constructor[PROPERTIES].set(key, value);
      }
    }

    applyElementFunctionality(constructor);
    customElements.define(tagName, constructor);
    return constructor;
  };
}

export function layout(tagName: string) {
  return function (constructor: any, context: ClassDecoratorContext) {
    // Transfer metadata from context to constructor
    if (context.metadata && (context.metadata as any)[PROPERTIES]) {
      if (!constructor[PROPERTIES]) {
        constructor[PROPERTIES] = new Map();
      }
      for (const [key, value] of (context.metadata as any)[PROPERTIES]) {
        constructor[PROPERTIES].set(key, value);
      }
    }

    applyElementFunctionality(constructor);
    customElements.define(tagName, constructor);
    return constructor;
  };
}

export function property(options?: PropertyOptions) {
  return function (_value: any, context: ClassFieldDecoratorContext) {
    const propertyKey = context.name as string;
    // Use metadata to store property information at decoration time
    if (!context.metadata) {
      (context as any).metadata = {};
    }
    if (!(context.metadata as any)[PROPERTIES]) {
      (context.metadata as any)[PROPERTIES] = new Map();
    }
    (context.metadata as any)[PROPERTIES].set(propertyKey, options || {});


    // Return a field initializer function for new decorators
    return function(this: any, initialValue: any) {
      // Detect type from initial value if not explicitly provided
      const finalOptions = { ...options };
      if (!finalOptions.type && initialValue !== undefined) {
        finalOptions.type = detectType(initialValue);

        // Update the metadata with the detected type
        const constructor = this.constructor as any;
        if (constructor[PROPERTIES]) {
          constructor[PROPERTIES].set(propertyKey, finalOptions);
        }
      }

      // Set up the property descriptor on first access
      if (!Object.hasOwnProperty.call(this.constructor.prototype, propertyKey)) {
        const descriptor: PropertyDescriptor = {
          get(this: any) {
            // Always read from DOM attribute - no internal state
            const attributeName = typeof finalOptions?.attribute === 'string' ? finalOptions?.attribute : propertyKey.toLowerCase();
            const attrValue = this.getAttribute?.(attributeName);

            // If attribute exists, parse it
            if (attrValue !== null) {
              return parseAttributeValue(attrValue, finalOptions || {}, undefined, initialValue);
            }

            // For Boolean properties that have been explicitly set via attribute,
            // follow HTML boolean attribute semantics (absence = false)
            const inferredType = finalOptions?.type || detectType(initialValue);
            if (inferredType === Boolean && this[EXPLICITLY_SET_PROPERTIES]?.has(propertyKey)) {
              return false;
            }

            // Otherwise return initial value
            return initialValue;
          },
          set(this: any, newValue: any) {
            // Get old value by calling the getter (which reads from attribute)
            const oldValue = this[propertyKey];

            // Check if value actually changed
            if (oldValue === newValue) return;

            // Always reflect to DOM - properties are always backed by attributes
            const attributeName = typeof finalOptions.attribute === 'string' ? finalOptions.attribute : propertyKey.toLowerCase();
            const attributeValue = valueToAttribute(newValue, finalOptions, initialValue);

            // Mark as explicitly set for boolean handling
            if (!this[EXPLICITLY_SET_PROPERTIES]) {
              this[EXPLICITLY_SET_PROPERTIES] = new Set();
            }
            this[EXPLICITLY_SET_PROPERTIES].add(propertyKey);

            // Flag to prevent attributeChangedCallback from triggering watchers for this change
            if (!this._settingFromProperty) this._settingFromProperty = new Set();
            this._settingFromProperty.add(attributeName.toLowerCase());

            if (attributeValue === null) {
              this.removeAttribute?.(attributeName);
            } else {
              this.setAttribute?.(attributeName, attributeValue);
            }

            // Remove the flag after a short delay to allow attributeChangedCallback to run
            setTimeout(() => {
              this._settingFromProperty?.delete(attributeName.toLowerCase());
            }, 0);

            // Trigger watchers directly with proper parsed values
            const constructor = this.constructor as any;
            const watchers = constructor[PROPERTY_WATCHERS];
            if (watchers) {
              if (watchers.has(propertyKey)) {
                const propertyWatchers = watchers.get(propertyKey);
                for (const watcher of propertyWatchers) {
                  try {
                    watcher.method.call(this, oldValue, newValue, propertyKey);
                  } catch (error) {
                    console.error(`Error in @watch('${propertyKey}') method ${watcher.methodName}:`, error);
                  }
                }
              }

              if (watchers.has('*')) {
                const wildcardWatchers = watchers.get('*');
                for (const watcher of wildcardWatchers) {
                  try {
                    watcher.method.call(this, oldValue, newValue, propertyKey);
                  } catch (error) {
                    console.error(`Error in @watch('*') method ${watcher.methodName}:`, error);
                  }
                }
              }
            }

            // v3.0.0: Trigger auto-render on property change
            // This respects @render options (debounce, throttle, once, sync)
            // Only trigger renders after element is fully initialized to avoid
            // infinite loops during initial setup
            if (this[RENDER_METHOD] && this[INITIALIZED]) {
              requestRender(this);
            }
          },
          configurable: true,
          enumerable: true
        };

        Object.defineProperty(this.constructor.prototype, propertyKey, descriptor);
      }

      // Initialize the property value
      if (!this[PROPERTY_VALUES]) {
        this[PROPERTY_VALUES] = {};
      }
      this[PROPERTY_VALUES][propertyKey] = initialValue;
      return initialValue;
    };
  };
}


export function query(selector: string, options: QueryOptions = {}) {
  return function (_value: any, context: ClassFieldDecoratorContext) {
    // Default to shadow DOM only
    const { light = false, shadow = true } = options;
    const propertyKey = context.name as string;


    // Return a field initializer function for new decorators
    return function(this: any, initialValue: any) {
      // Set up the property descriptor on first access
      if (!Object.hasOwnProperty.call(this.constructor.prototype, propertyKey)) {
        const descriptor: PropertyDescriptor = {
          get() {
            // Check if this is a controller using the symbol
            const isController = (this as any)[IS_CONTROLLER_INSTANCE] === true;
            const root = isController && (this as any).element ? (this as any).element : this;

            // Query in specified contexts
            let result = null;

            if (shadow && root.shadowRoot) {
              result = root.shadowRoot.querySelector(selector);
            }

            if (!result && light) {
              result = root.querySelector(selector);
            }

            return result || null;
          },
          set() {
            // Query results are read-only
          },
          configurable: true,
          enumerable: true
        };

        Object.defineProperty(this.constructor.prototype, propertyKey, descriptor);
      }

      return initialValue;
    };
  };
}

export function queryAll(selector: string, options: QueryOptions = {}) {
  return function (_value: any, context: ClassFieldDecoratorContext) {
    // Default to shadow DOM only
    const { light = false, shadow = true } = options;
    const propertyKey = context.name as string;

    // Return a field initializer function for new decorators
    return function(this: any, initialValue: any) {
      // Set up the property descriptor on first access
      if (!Object.hasOwnProperty.call(this.constructor.prototype, propertyKey)) {
        const descriptor: PropertyDescriptor = {
          get() {
            // Check if this is a controller using the symbol
            const isController = (this as any)[IS_CONTROLLER_INSTANCE] === true;
            const root = isController && (this as any).element ? (this as any).element : this;

            // Query in specified contexts and combine results
            const results: Element[] = [];

            if (shadow && root.shadowRoot) {
              const shadowResults = root.shadowRoot.querySelectorAll(selector);
              results.push(...shadowResults);
            }

            if (light) {
              const lightResults = root.querySelectorAll(selector);
              results.push(...lightResults);
            }

            // Return a static NodeList-like object
            return results as any as NodeListOf<Element>;
          },
          set() {
            // Query results are read-only
          },
          configurable: true,
          enumerable: true
        };

        Object.defineProperty(this.constructor.prototype, propertyKey, descriptor);
      }

      return initialValue;
    };
  };
}






export function watch(...propertyNames: string[]) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      if (!constructor[PROPERTY_WATCHERS]) {
        constructor[PROPERTY_WATCHERS] = new Map();
      }

      // Store the watcher method for each property
      for (const propertyName of propertyNames) {
        if (!constructor[PROPERTY_WATCHERS].has(propertyName)) {
          constructor[PROPERTY_WATCHERS].set(propertyName, []);
        }

        constructor[PROPERTY_WATCHERS].get(propertyName).push({
          methodName,
          method: target
        });
      }
    });
  };
}

/**
 * Decorator that injects router context into a property
 * The context is automatically provided to page components by the router
 */
export function context() {
  return function(_value: any, context: ClassFieldDecoratorContext) {
    const propertyKey = context.name as string;

    // Return a field initializer function for new decorators
    return function(this: any, initialValue: any) {
      // Set up the property descriptor on first access
      if (!Object.hasOwnProperty.call(this.constructor.prototype, propertyKey)) {
        const descriptor: PropertyDescriptor = {
          get() {
            // First check if context is stored directly on this element
            if ((this as any)[ROUTER_CONTEXT] !== undefined) {
              return (this as any)[ROUTER_CONTEXT];
            }

            // Otherwise, request context from parent page via event
            const detail: any = { target: this };
            const event = new CustomEvent('@context/request', {
              bubbles: true,
              cancelable: true,
              detail
            });

            // Dispatch event and wait for response
            // Check if this is a controller using the symbol
            const isController = (this as any)[IS_CONTROLLER_INSTANCE] === true;
            let targetElement = isController && (this as any).element ? (this as any).element : this;

            // If element is null (e.g., controller was detached), can't get context
            if (!targetElement || !targetElement.dispatchEvent) {
              return undefined;
            }

            // If we're in shadow DOM, dispatch on the host element to ensure proper bubbling
            if (targetElement.getRootNode && targetElement.getRootNode() instanceof ShadowRoot) {
              const shadowRoot = targetElement.getRootNode() as ShadowRoot;
              targetElement = shadowRoot.host as HTMLElement;
            }

            targetElement.dispatchEvent(event);

            // Check if context was provided via the event
            if (detail.context !== undefined) {
              // Cache it for future use
              (this as any)[ROUTER_CONTEXT] = detail.context;
              return detail.context;
            }

            return undefined;
          },
          set() {
            // Context is read-only
          },
          configurable: true,
          enumerable: true
        };

        Object.defineProperty(this.constructor.prototype, propertyKey, descriptor);
      }

      return initialValue;
    };
  };
}

/**
 * Decorator for methods that should run when element is ready
 * Runs after shadow DOM, controller attachment, and event setup
 * Supports async methods
 */
export function ready() {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      if (!constructor[READY_HANDLERS]) {
        constructor[READY_HANDLERS] = [];
      }

      constructor[READY_HANDLERS].push({
        methodName,
        method: target
      });
    });
  };
}

/**
 * Decorator for methods that should run when element is being disposed
 * Used for cleanup tasks when element is removed from DOM
 */
export function dispose() {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      if (!constructor[DISPOSE_HANDLERS]) {
        constructor[DISPOSE_HANDLERS] = [];
      }

      constructor[DISPOSE_HANDLERS].push({
        methodName,
        method: target
      });
    });
  };
}

/**
 * Decorator for methods that should run when element is moved within DOM
 * Supports debounce and throttle options to control execution timing
 */
export function moved(options: MovedOptions = {}) {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      if (!constructor[MOVED_HANDLERS]) {
        constructor[MOVED_HANDLERS] = [];
      }

      constructor[MOVED_HANDLERS].push({
        methodName,
        method: originalMethod,
        options
      });
    });

    // Return wrapped method that handles timing options
    return function (this: HTMLElement, ...args: any[]) {
      // Initialize timers storage if not present
      if (!(this as any)[MOVED_TIMERS]) {
        (this as any)[MOVED_TIMERS] = new Map();
      }

      // Get or create timers for this specific method
      if (!(this as any)[MOVED_TIMERS].has(methodName)) {
        (this as any)[MOVED_TIMERS].set(methodName, {
          throttleTimer: null,
          debounceTimer: null,
          lastThrottleCall: 0
        });
      }

      const timers = (this as any)[MOVED_TIMERS].get(methodName);

      // Helper function to execute method
      const executeMethod = (...methodArgs: any[]) => {
        return originalMethod.apply(this, methodArgs);
      };

      const hasDebounce = options.debounce !== undefined && options.debounce > 0;
      const hasThrottle = options.throttle !== undefined && options.throttle > 0;

      // Handle timing based on priority: debounce > throttle > immediate
      switch (true) {
        case hasDebounce: {
          clearTimeout(timers.debounceTimer);
          timers.debounceTimer = setTimeout(() => executeMethod(...args), options.debounce!);
          return undefined;
        }

        case hasThrottle: {
          const throttleMs = options.throttle!;
          const now = Date.now();
          const canExecuteImmediately = timers.lastThrottleCall === 0 || now - timers.lastThrottleCall >= throttleMs;

          if (canExecuteImmediately) {
            timers.lastThrottleCall = now;
            return executeMethod(...args);
          }

          const hasScheduledTimer = !!timers.throttleTimer;
          if (!hasScheduledTimer) {
            const remainingTime = throttleMs - (now - timers.lastThrottleCall);
            timers.throttleTimer = setTimeout(() => {
              timers.throttleTimer = null;
              timers.lastThrottleCall = Date.now();
              executeMethod(...args);
            }, remainingTime);
          }
          return undefined;
        }

        default:
          return executeMethod(...args);
      }
    };
  };
}

/**
 * Decorator for methods that should run when element is adopted to new document
 * Supports debounce and throttle options to control execution timing
 */
export function adopted(options: AdoptedOptions = {}) {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      if (!constructor[ADOPTED_HANDLERS]) {
        constructor[ADOPTED_HANDLERS] = [];
      }

      constructor[ADOPTED_HANDLERS].push({
        methodName,
        method: originalMethod,
        options
      });
    });

    // Return wrapped method that handles timing options
    return function (this: HTMLElement, ...args: any[]) {
      // Initialize timers storage if not present
      if (!(this as any)[ADOPTED_TIMERS]) {
        (this as any)[ADOPTED_TIMERS] = new Map();
      }

      // Get or create timers for this specific method
      if (!(this as any)[ADOPTED_TIMERS].has(methodName)) {
        (this as any)[ADOPTED_TIMERS].set(methodName, {
          throttleTimer: null,
          debounceTimer: null,
          lastThrottleCall: 0
        });
      }

      const timers = (this as any)[ADOPTED_TIMERS].get(methodName);

      // Helper function to execute method
      const executeMethod = (...methodArgs: any[]) => {
        return originalMethod.apply(this, methodArgs);
      };

      const hasDebounce = options.debounce !== undefined && options.debounce > 0;
      const hasThrottle = options.throttle !== undefined && options.throttle > 0;

      // Handle timing based on priority: debounce > throttle > immediate
      switch (true) {
        case hasDebounce: {
          clearTimeout(timers.debounceTimer);
          timers.debounceTimer = setTimeout(() => executeMethod(...args), options.debounce!);
          return undefined;
        }

        case hasThrottle: {
          const throttleMs = options.throttle!;
          const now = Date.now();
          const canExecuteImmediately = timers.lastThrottleCall === 0 || now - timers.lastThrottleCall >= throttleMs;

          if (canExecuteImmediately) {
            timers.lastThrottleCall = now;
            return executeMethod(...args);
          }

          const hasScheduledTimer = !!timers.throttleTimer;
          if (!hasScheduledTimer) {
            const remainingTime = throttleMs - (now - timers.lastThrottleCall);
            timers.throttleTimer = setTimeout(() => {
              timers.throttleTimer = null;
              timers.lastThrottleCall = Date.now();
              executeMethod(...args);
            }, remainingTime);
          }
          return undefined;
        }

        default:
          return executeMethod(...args);
      }
    };
  };
}

// @part decorator removed in v3.0.0
// Use @render with differential rendering instead