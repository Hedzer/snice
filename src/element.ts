import { attachController, detachController } from './controller';
import { setupEventHandlers, cleanupEventHandlers } from './events';
import { setupObservers, cleanupObservers } from './observe';
import { setupResponseHandlers, cleanupResponseHandlers } from './request-response';
import { parseAttributeValue, detectType } from './utils';
import { IS_ELEMENT_CLASS, IS_CONTROLLER_INSTANCE, READY_PROMISE, READY_RESOLVE, CONTROLLER, PROPERTIES, PROPERTY_VALUES, PROPERTIES_INITIALIZED, PROPERTY_WATCHERS, EXPLICITLY_SET_PROPERTIES, ROUTER_CONTEXT, READY_HANDLERS, DISPOSE_HANDLERS, PARTS, PART_TIMERS } from './symbols';
import { QueryOptions } from './types/QueryOptions';
import { PropertyOptions } from './types/PropertyOptions';
import { PartOptions } from './types/PartOptions';
import { SimpleArray } from './types/SimpleArray';

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
        
        // Reflect properties that were explicitly set before connection
        // AND also reflect initial values that have reflect: true
        if (properties) {
          for (const [propName, propOptions] of properties) {
            const wasExplicitlySet = this[EXPLICITLY_SET_PROPERTIES] && this[EXPLICITLY_SET_PROPERTIES].has(propName);
            const hasInitialValue = propName in this[PROPERTY_VALUES];

            if (propOptions.reflect && hasInitialValue && (wasExplicitlySet || this[PROPERTY_VALUES][propName] !== undefined)) {
              const value = this[PROPERTY_VALUES][propName];
              const attributeName = typeof propOptions.attribute === 'string' ? propOptions.attribute : propName.toLowerCase();
              
              if (value !== null && value !== undefined && value !== false && 
                  !(propOptions.type === SimpleArray && Array.isArray(value) && value.length === 0)) {
                // Handle special types for reflection
                let attributeValue: string;
                if (value instanceof Date) {
                  attributeValue = value.toISOString();
                } else if (typeof value === 'bigint') {
                  attributeValue = value.toString() + 'n';
                } else if (propOptions.type === SimpleArray && Array.isArray(value)) {
                  attributeValue = SimpleArray.serialize(value);
                } else {
                  attributeValue = String(value);
                }
                this.setAttribute(attributeName, attributeValue);
              }
            }
          }
        }
        
        // Clean up any existing event handlers first (for reconnection)
        cleanupEventHandlers(this);
        
        // Create shadow root if it doesn't exist
        if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' });
        }
        
        // Build the shadow DOM content
        let shadowContent = '';
        
        // Add HTML first (maintaining original order)
        if (this.html) {
          try {
            const htmlResult = this.html();
            // Handle both async and sync html
            const htmlContent = htmlResult instanceof Promise ? await htmlResult : htmlResult;
            if (htmlContent !== undefined) {
              shadowContent += htmlContent;
            }
          } catch (error) {
            console.error(`Error in html() method for ${this.tagName}:`, error);
          }
        }
        
        // Add CSS after HTML (maintaining original order)
        if (this.css) {
          try {
            const cssResult = this.css();
            // Handle both async and sync css
            const cssResolved = cssResult instanceof Promise ? await cssResult : cssResult;
            if (cssResolved) {
              // Handle both string and array of strings
              const cssContent = Array.isArray(cssResolved) ? cssResolved.join('\n') : cssResolved;
              // No need for scoping with Shadow DOM, but add data attribute for compatibility
              shadowContent += `<style data-component-css>${cssContent}</style>`;
            }
          } catch (error) {
            console.error(`Error in css() method for ${this.tagName}:`, error);
          }
        }
        
        // Set shadow DOM content
        if (shadowContent) {
          this.shadowRoot.innerHTML = shadowContent;
        }
        
        // Render all @part methods into their corresponding elements
        const parts = constructor[PARTS];
        if (parts && this.shadowRoot) {
          for (const [partName, partHandler] of parts) {
            try {
              const partElement = this.shadowRoot.querySelector(`[part="${partName}"]`);
              if (partElement) {
                // For initial render, call original method directly to avoid timing restrictions
                const partResult = partHandler.method.call(this);
                const partContent = partResult instanceof Promise ? await partResult : partResult;
                if (partContent !== undefined) {
                  partElement.innerHTML = partContent;
                }
              }
            } catch (error) {
              console.error(`Error rendering @part('${partName}') in ${this.tagName}:`, error);
            }
          }
        }

        // Setup @on event handlers - use element for host events, shadow root for delegated events
        setupEventHandlers(this, this);

        // Setup @respond handlers for elements
        setupResponseHandlers(this, this);

        // Setup @observe observers
        try {
          setupObservers(this, this);
        } catch (error) {
          console.error(`Error setting up observers for ${this.tagName}:`, error);
        }
        
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
      // Cleanup @on event handlers
      cleanupEventHandlers(this);
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
              break;
            }
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

    // Warn about problematic reflection usage at decoration time
    if (options?.reflect && options?.type === Array) {
      console.warn(`⚠️  Property '${propertyKey}' uses reflect:true with Array type.`);
    }

    if (options?.reflect && options?.type === Object) {
      console.warn(`⚠️  Property '${propertyKey}' uses reflect:true with Object type.`);
    }

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
            if (!this[PROPERTY_VALUES]) {
              this[PROPERTY_VALUES] = {};
            }

            // If we have a stored value, return it
            if (this[PROPERTY_VALUES][propertyKey] !== undefined) {
              return this[PROPERTY_VALUES][propertyKey];
            }

            // Otherwise check attribute and parse it, or return initial value
            const attributeName = typeof finalOptions?.attribute === 'string' ? finalOptions?.attribute : propertyKey.toLowerCase();
            const attrValue = this.getAttribute?.(attributeName);

            // If attribute exists or we have a type that needs special handling for null (like Boolean)
            if (attrValue !== null || finalOptions?.type === Boolean) {
              return parseAttributeValue(attrValue, finalOptions || {}, undefined, initialValue);
            }

            return initialValue;
          },
          set(this: any, newValue: any) {
            if (!this[PROPERTY_VALUES]) {
              this[PROPERTY_VALUES] = {};
            }
            if (!this[EXPLICITLY_SET_PROPERTIES]) {
              this[EXPLICITLY_SET_PROPERTIES] = new Set();
            }

            const oldValue = this[PROPERTY_VALUES][propertyKey];

            if (oldValue === newValue) return;

            const isInitialDefaultValue = oldValue === undefined && !this[PROPERTIES_INITIALIZED];
            if (oldValue !== undefined || (isInitialDefaultValue && newValue !== null && newValue !== undefined)) {
              this[EXPLICITLY_SET_PROPERTIES].add(propertyKey);
            }

            this[PROPERTY_VALUES][propertyKey] = newValue;

            if (finalOptions?.reflect && this.setAttribute && this[PROPERTIES_INITIALIZED] && this[EXPLICITLY_SET_PROPERTIES].has(propertyKey)) {
              const attributeName = typeof finalOptions.attribute === 'string' ? finalOptions.attribute : propertyKey.toLowerCase();

              if (newValue === null || newValue === undefined || newValue === false ||
                  (finalOptions?.type === SimpleArray && Array.isArray(newValue) && newValue.length === 0)) {
                this.removeAttribute(attributeName);
              } else {
                let attributeValue: string;
                if (newValue instanceof Date) {
                  attributeValue = newValue.toISOString();
                } else if (typeof newValue === 'bigint') {
                  attributeValue = newValue.toString() + 'n';
                } else if (finalOptions?.type === SimpleArray && Array.isArray(newValue)) {
                  attributeValue = SimpleArray.serialize(newValue);
                } else {
                  attributeValue = String(newValue);
                }
                this.setAttribute(attributeName, attributeValue);
              }
            }

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

            if (this.requestUpdate) {
              this.requestUpdate(propertyKey, oldValue);
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
 * Decorator for methods that render specific parts of the template
 * Parts are identified by the 'part' attribute in the HTML template
 * When the decorated method is called, it automatically re-renders its part
 */
export function part(partName: string, options: PartOptions = {}) {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      if (!constructor[PARTS]) {
        constructor[PARTS] = new Map();
      }

      constructor[PARTS].set(partName, {
        methodName,
        method: originalMethod
      });
    });

    // Return wrapped method that automatically re-renders the part when called
    return function (this: HTMLElement, ...args: any[]) {
      // Initialize timers storage if not present
      if (!(this as any)[PART_TIMERS]) {
        (this as any)[PART_TIMERS] = new Map();
      }

      // Get or create timers for this specific part
      if (!(this as any)[PART_TIMERS].has(partName)) {
        (this as any)[PART_TIMERS].set(partName, {
          throttleTimer: null,
          debounceTimer: null,
          lastThrottleCall: 0
        });
      }

      const timers = (this as any)[PART_TIMERS].get(partName);

      // Helper function to execute method and update DOM
      const executeAndUpdate = (...methodArgs: any[]) => {
        const result = originalMethod.apply(this, methodArgs);

        const updateDOM = (content: any) => {
          const hasContent = content !== undefined;
          const hasElement = this.shadowRoot?.querySelector(`[part="${partName}"]`);

          if (hasContent && hasElement) {
            hasElement.innerHTML = content;
          }
        };

        const isPromise = result instanceof Promise;
        return isPromise
          ? result.then(content => { updateDOM(content); return content; })
          : (updateDOM(result), result);
      };

      const hasDebounce = options.debounce !== undefined && options.debounce > 0;
      const hasThrottle = options.throttle !== undefined && options.throttle > 0;

      // Handle timing based on priority: debounce > throttle > immediate
      switch (true) {
        case hasDebounce: {
          clearTimeout(timers.debounceTimer);
          timers.debounceTimer = setTimeout(() => executeAndUpdate(...args), options.debounce!);
          return undefined;
        }

        case hasThrottle: {
          const throttleMs = options.throttle!;
          const now = Date.now();
          const canExecuteImmediately = timers.lastThrottleCall === 0 || now - timers.lastThrottleCall >= throttleMs;

          if (canExecuteImmediately) {
            timers.lastThrottleCall = now;
            return executeAndUpdate(...args);
          }

          const hasScheduledTimer = !!timers.throttleTimer;
          if (!hasScheduledTimer) {
            const remainingTime = throttleMs - (now - timers.lastThrottleCall);
            timers.throttleTimer = setTimeout(() => {
              timers.throttleTimer = null;
              timers.lastThrottleCall = Date.now();
              executeAndUpdate(...args);
            }, remainingTime);
          }
          return undefined;
        }

        default:
          return executeAndUpdate(...args);
      }
    };
  };
}