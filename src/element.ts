import { attachController, detachController } from './controller';
import { setupEventHandlers, cleanupEventHandlers } from './events';
import { IS_ELEMENT_CLASS, IS_CONTROLLER_INSTANCE, READY_PROMISE, READY_RESOLVE, CONTROLLER, PROPERTIES, PROPERTY_VALUES, PROPERTIES_INITIALIZED, PROPERTY_WATCHERS, EXPLICITLY_SET_PROPERTIES, ROUTER_CONTEXT, READY_HANDLERS, DISPOSE_HANDLERS } from './symbols';

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
    
    // Add all reflected properties to observed attributes
    const properties = constructor[PROPERTIES];
    if (properties) {
      for (const [propName, propOptions] of properties) {
        if (propOptions.reflect) {
          const attributeName = typeof propOptions.attribute === 'string' ? propOptions.attribute : propName;
          if (!observedAttributes.includes(attributeName)) {
            observedAttributes.push(attributeName);
          }
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
            if (propOptions.reflect) {
              const attributeName = typeof propOptions.attribute === 'string' ? propOptions.attribute : propName;
              // Only read from attribute if property hasn't been set yet
              if (this.hasAttribute(attributeName) && !(propName in (this[PROPERTY_VALUES] || {}))) {
                // Attribute exists, parse and set the property value
                const attrValue = this.getAttribute(attributeName);
                
                // Mark as explicitly set since it came from an attribute
                if (!this[EXPLICITLY_SET_PROPERTIES]) {
                  this[EXPLICITLY_SET_PROPERTIES] = new Set();
                }
                this[EXPLICITLY_SET_PROPERTIES].add(propName);
                
                if (propOptions.type === Boolean) {
                  this[propName] = attrValue !== null && attrValue !== 'false';
                } else if (propOptions.type === Number) {
                  this[propName] = Number(attrValue);
                } else {
                  this[propName] = attrValue;
                }
              }
            }
          }
        }
        
        // Mark that properties have been initialized
        this[PROPERTIES_INITIALIZED] = true;
        
        // Reflect properties that were explicitly set before connection
        // but skip default values that were never explicitly set
        if (properties && this[EXPLICITLY_SET_PROPERTIES]) {
          for (const [propName, propOptions] of properties) {
            if (propOptions.reflect && this[EXPLICITLY_SET_PROPERTIES].has(propName) && propName in this[PROPERTY_VALUES]) {
              const value = this[PROPERTY_VALUES][propName];
              const attributeName = typeof propOptions.attribute === 'string' ? propOptions.attribute : propName;
              
              if (value !== null && value !== undefined && value !== false) {
                this.setAttribute(attributeName, String(value));
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
        
        // NOW call the original user-defined connectedCallback after shadow DOM is set up
        if (originalConnectedCallback) {
          originalConnectedCallback.call(this);
        }
        
        const controllerName = this.getAttribute('controller');
        if (controllerName) {
          this.controller = controllerName;
        }
        // Setup @on event handlers - use element for host events, shadow root for delegated events
        setupEventHandlers(this, this);
        
        // Call @ready handlers after everything is set up
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
      } finally {
        // Always mark element as ready, even if there were errors
        if (this[READY_RESOLVE]) {
          this[READY_RESOLVE]();
          this[READY_RESOLVE] = null; // Clear the resolver
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
    };
    
    constructor.prototype.attributeChangedCallback = function(name: string, oldValue: string, newValue: string) {
      originalAttributeChangedCallback?.call(this, name, oldValue, newValue);
      if (name === 'controller') {
        this.controller = newValue;
      } else {
        // Handle reflected properties
        const properties = constructor[PROPERTIES];
        if (properties) {
          for (const [propName, propOptions] of properties) {
            if (propOptions.reflect) {
              const attributeName = typeof propOptions.attribute === 'string' ? propOptions.attribute : propName;
              if (attributeName === name) {
                // Check if the current property value already matches to avoid feedback loops
                const currentValue = this[PROPERTY_VALUES]?.[propName];
                
                // Parse the new value based on type
                let parsedValue: any;
                if (propOptions.type === Boolean) {
                  parsedValue = newValue !== null && newValue !== 'false';
                } else if (propOptions.type === Number) {
                  parsedValue = Number(newValue);
                } else {
                  // If no type specified, try to infer from current value type
                  if (typeof currentValue === 'number' && newValue !== null) {
                    parsedValue = Number(newValue);
                  } else {
                    parsedValue = newValue;
                  }
                }
                
                // Only update if the value actually changed
                if (currentValue !== parsedValue) {
                  // Mark as explicitly set since it came from an attribute change
                  if (!this[EXPLICITLY_SET_PROPERTIES]) {
                    this[EXPLICITLY_SET_PROPERTIES] = new Set();
                  }
                  this[EXPLICITLY_SET_PROPERTIES].add(propName);
                  
                  this[propName] = parsedValue;
                }
                break;
              }
            }
          }
        }
      }
    };
}

export function element(tagName: string) {
  return function (constructor: any) {
    applyElementFunctionality(constructor);
    customElements.define(tagName, constructor);
  };
}

// Alias for backwards compatibility
export const customElement = element;

export function property(options?: PropertyOptions) {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    
    if (!constructor[PROPERTIES]) {
      constructor[PROPERTIES] = new Map();
    }
    
    constructor[PROPERTIES].set(propertyKey, options || {});
    
    const descriptor: PropertyDescriptor = {
      get(this: any) {
        if (!this[PROPERTY_VALUES]) {
          this[PROPERTY_VALUES] = {};
        }
        return this[PROPERTY_VALUES][propertyKey];
      },
      set(this: any, value: any) {
        if (!this[PROPERTY_VALUES]) {
          this[PROPERTY_VALUES] = {};
        }
        if (!this[EXPLICITLY_SET_PROPERTIES]) {
          this[EXPLICITLY_SET_PROPERTIES] = new Set();
        }
        
        const oldValue = this[PROPERTY_VALUES][propertyKey];
        
        // Don't update if value hasn't changed
        if (oldValue === value) return;
        
        // Only mark as explicitly set if there was a previous value
        // (i.e., this is not the initial default value being set during class initialization)
        if (oldValue !== undefined) {
          this[EXPLICITLY_SET_PROPERTIES].add(propertyKey);
        }
        
        this[PROPERTY_VALUES][propertyKey] = value;
        
        // Only reflect to attributes if:
        // 1. Properties have been initialized from attributes  
        // 2. The property was explicitly set (not just default value)
        // This prevents default values from creating attributes
        if (options?.reflect && this.setAttribute && this[PROPERTIES_INITIALIZED] && this[EXPLICITLY_SET_PROPERTIES].has(propertyKey)) {
          const attributeName = typeof options.attribute === 'string' ? options.attribute : propertyKey;
          
          if (value === null || value === undefined || value === false) {
            this.removeAttribute(attributeName);
          } else {
            this.setAttribute(attributeName, String(value));
          }
        }
        
        // Call watchers for this property
        const watchers = constructor[PROPERTY_WATCHERS];
        if (watchers) {
          // Call specific property watchers
          if (watchers.has(propertyKey)) {
            const propertyWatchers = watchers.get(propertyKey);
            for (const watcher of propertyWatchers) {
              try {
                // Always pass oldValue, newValue, and propertyName
                watcher.method.call(this, oldValue, value, propertyKey);
              } catch (error) {
                console.error(`Error in @watch('${propertyKey}') method ${watcher.methodName}:`, error);
              }
            }
          }
          
          // Call wildcard watchers (watching "*")
          if (watchers.has('*')) {
            const wildcardWatchers = watchers.get('*');
            for (const watcher of wildcardWatchers) {
              try {
                // Same signature for consistency
                watcher.method.call(this, oldValue, value, propertyKey);
              } catch (error) {
                console.error(`Error in @watch('*') method ${watcher.methodName}:`, error);
              }
            }
          }
        }
        
        // Call requestUpdate if available and value changed
        if (this.requestUpdate) {
          this.requestUpdate(propertyKey, oldValue);
        }
      },
      enumerable: true,
      configurable: true,
    };
    
    Object.defineProperty(target, propertyKey, descriptor);
  };
}

export interface QueryOptions {
  light?: boolean;
  shadow?: boolean;
}

export function query(selector: string, options: QueryOptions = {}) {
  return function (target: any, propertyKey: string) {
    // Default to shadow DOM only
    const { light = false, shadow = true } = options;
    
    Object.defineProperty(target, propertyKey, {
      get() {
        // Check if this is a controller using the symbol
        const isController = this[IS_CONTROLLER_INSTANCE] === true;
        const root = isController && this.element ? this.element : this;
        
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
      enumerable: true,
      configurable: true,
    });
  };
}

export function queryAll(selector: string, options: QueryOptions = {}) {
  return function (target: any, propertyKey: string) {
    // Default to shadow DOM only
    const { light = false, shadow = true } = options;
    
    Object.defineProperty(target, propertyKey, {
      get() {
        // Check if this is a controller using the symbol
        const isController = this[IS_CONTROLLER_INSTANCE] === true;
        const root = isController && this.element ? this.element : this;
        
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
      enumerable: true,
      configurable: true,
    });
  };
}

export interface PropertyOptions {
  type?: StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor;
  reflect?: boolean;
  attribute?: string | boolean;
  converter?: PropertyConverter;
  hasChanged?: (value: any, oldValue: any) => boolean;
}

export interface PropertyConverter {
  fromAttribute?(value: string | null, type?: any): any;
  toAttribute?(value: any, type?: any): string | null;
}

export function watch(...propertyNames: string[]) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const constructor = target.constructor;
    
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
        method: descriptor.value
      });
    }
    
    return descriptor;
  };
}

/**
 * Decorator that injects router context into a property
 * The context is automatically provided to page components by the router
 */
export function context() {
  return function(target: any, propertyKey: string) {
    // Define property getter that returns the context
    Object.defineProperty(target, propertyKey, {
      get() {
        // First check if context is stored directly on this element
        if (this[ROUTER_CONTEXT] !== undefined) {
          return this[ROUTER_CONTEXT];
        }
        
        // Otherwise, request context from parent page via event
        const detail: any = { target: this };
        const event = new CustomEvent('@context/request', {
          bubbles: true,
          cancelable: true,
          detail
        });
        
        // Dispatch event and wait for response
        // For controllers, use their element. For elements, dispatch on the host
        let targetElement = this.element || this;
        
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
          this[ROUTER_CONTEXT] = detail.context;
          return detail.context;
        }
        
        return undefined;
      },
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * Decorator for methods that should run when element is ready
 * Runs after shadow DOM, controller attachment, and event setup
 * Supports async methods
 */
export function ready() {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const constructor = target.constructor;
    
    if (!constructor[READY_HANDLERS]) {
      constructor[READY_HANDLERS] = [];
    }
    
    constructor[READY_HANDLERS].push({
      methodName,
      method: descriptor.value
    });
    
    return descriptor;
  };
}

/**
 * Decorator for methods that should run when element is being disposed
 * Used for cleanup tasks when element is removed from DOM
 */
export function dispose() {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const constructor = target.constructor;
    
    if (!constructor[DISPOSE_HANDLERS]) {
      constructor[DISPOSE_HANDLERS] = [];
    }
    
    constructor[DISPOSE_HANDLERS].push({
      methodName,
      method: descriptor.value
    });
    
    return descriptor;
  };
}