import { attachController, detachController } from './controller';
import { setupEventHandlers, cleanupEventHandlers } from './events';
import { setupObservers, cleanupObservers } from './observe';
import { setupResponseHandlers, cleanupResponseHandlers } from './request-response';
import { IS_ELEMENT_CLASS, IS_CONTROLLER_INSTANCE, READY_PROMISE, READY_RESOLVE, CONTROLLER, PROPERTIES, PROPERTY_VALUES, PROPERTIES_INITIALIZED, PROPERTY_WATCHERS, EXPLICITLY_SET_PROPERTIES, ROUTER_CONTEXT, READY_HANDLERS, DISPOSE_HANDLERS, PARTS, PART_TIMERS } from './symbols';

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
            // If attribute exists, it always wins
            if (this.hasAttribute(propName)) {
              // Attribute exists, parse and set the property value
              const attrValue = this.getAttribute(propName);
              
              // Mark as explicitly set since it came from an attribute
              if (!this[EXPLICITLY_SET_PROPERTIES]) {
                this[EXPLICITLY_SET_PROPERTIES] = new Set();
              }
              this[EXPLICITLY_SET_PROPERTIES].add(propName);
              
              switch (propOptions.type) {
                case Boolean:
                  this[propName] = attrValue !== null && attrValue !== 'false';
                  break;
                case Number:
                  this[propName] = Number(attrValue);
                  break;
                case String:
                  this[propName] = attrValue;
                  break;
                case Date:
                  this[propName] = attrValue ? new Date(attrValue) : null;
                  break;
                case BigInt:
                  if (attrValue && attrValue.endsWith('n')) {
                    this[propName] = BigInt(attrValue.slice(0, -1));
                  } else {
                    this[propName] = attrValue ? BigInt(attrValue) : null;
                  }
                  break;
                case SimpleArray:
                  this[propName] = SimpleArray.parse(attrValue);
                  break;
                default:
                  this[propName] = attrValue;
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
        
        // Setup @respond handlers for elements
        setupResponseHandlers(this, this);
        
        // Setup @observe observers
        try {
          setupObservers(this, this);
        } catch (error) {
          console.error(`Error setting up observers for ${this.tagName}:`, error);
        }
        
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
            if (attributeName === name) {
              // Check if the current property value already matches to avoid feedback loops
              const currentValue = this[PROPERTY_VALUES]?.[propName];
              
              // Parse the new value based on type
              let parsedValue: any;
              if (propOptions.type === Boolean) {
                parsedValue = newValue !== null && newValue !== 'false';
              } else if (propOptions.type === Number) {
                parsedValue = Number(newValue);
              } else if (propOptions.type === Date) {
                parsedValue = newValue ? new Date(newValue) : null;
              } else if (propOptions.type === BigInt) {
                if (newValue && newValue.endsWith('n')) {
                  parsedValue = BigInt(newValue.slice(0, -1));
                } else {
                  parsedValue = newValue ? BigInt(newValue) : null;
                }
              } else if (propOptions.type === SimpleArray) {
                parsedValue = SimpleArray.parse(newValue);
              } else {
                // If no type specified, try to infer from current value type
                if (typeof currentValue === 'number' && newValue !== null) {
                  parsedValue = Number(newValue);
                } else {
                  parsedValue = newValue;
                }
              }
              
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
  return function (constructor: any) {
    applyElementFunctionality(constructor);
    customElements.define(tagName, constructor);
  };
}

export function layout(tagName: string) {
  return function (constructor: any) {
    applyElementFunctionality(constructor);
    customElements.define(tagName, constructor);
  };
}

export function property(options?: PropertyOptions) {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    
    // Warn about problematic reflection usage
    if (options?.reflect && options?.type === Array) {
      console.warn(`⚠️  Property '${propertyKey}' uses reflect:true with Array type.`);
    }
    
    if (options?.reflect && options?.type === Object) {
      console.warn(`⚠️  Property '${propertyKey}' uses reflect:true with Object type.`);
    }
    
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
        
        // Mark as explicitly set in these cases:
        // 1. There was a previous value (normal property update)
        // 2. This is during element construction and we have a non-null/non-undefined value
        //    (this handles default values declared in class properties)
        const isInitialDefaultValue = oldValue === undefined && !this[PROPERTIES_INITIALIZED];
        if (oldValue !== undefined || (isInitialDefaultValue && value !== null && value !== undefined)) {
          this[EXPLICITLY_SET_PROPERTIES].add(propertyKey);
        }
        
        this[PROPERTY_VALUES][propertyKey] = value;
        
        // Only reflect to attributes if:
        // 1. Properties have been initialized from attributes  
        // 2. The property was explicitly set (not just default value)
        // This prevents default values from creating attributes
        if (options?.reflect && this.setAttribute && this[PROPERTIES_INITIALIZED] && this[EXPLICITLY_SET_PROPERTIES].has(propertyKey)) {
          const attributeName = typeof options.attribute === 'string' ? options.attribute : propertyKey.toLowerCase();
          
          if (value === null || value === undefined || value === false || 
              (options?.type === SimpleArray && Array.isArray(value) && value.length === 0)) {
            this.removeAttribute(attributeName);
          } else {
            // Handle special types for reflection
            let attributeValue: string;
            if (value instanceof Date) {
              attributeValue = value.toISOString();
            } else if (typeof value === 'bigint') {
              attributeValue = value.toString() + 'n';
            } else if (options?.type === SimpleArray && Array.isArray(value)) {
              attributeValue = SimpleArray.serialize(value);
            } else {
              attributeValue = String(value);
            }
            this.setAttribute(attributeName, attributeValue);
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

/**
 * SimpleArray type for arrays that can be safely reflected to attributes
 * Supports arrays of: string, number, boolean
 * Uses full-width comma (，) as separator to avoid conflicts
 * Strings cannot contain the full-width comma character
 */
export class SimpleArray {
  static readonly SEPARATOR = '，'; // U+FF0C Full-width comma
  
  /**
   * Serialize array to string for attribute storage
   */
  static serialize(arr: (string | number | boolean)[]): string {
    if (!Array.isArray(arr)) return '';
    
    return arr.map(item => {
      if (typeof item === 'string') {
        // Validate string doesn't contain our separator
        if (item.includes(SimpleArray.SEPARATOR)) {
          throw new Error(`SimpleArray strings cannot contain the character "${SimpleArray.SEPARATOR}" (U+FF0C)`);
        }
        return item;
      } else if (typeof item === 'number' || typeof item === 'boolean') {
        return String(item);
      } else {
        throw new Error(`SimpleArray only supports string, number, and boolean types. Got: ${typeof item}`);
      }
    }).join(SimpleArray.SEPARATOR);
  }
  
  /**
   * Parse string from attribute back to array
   */
  static parse(str: string | null): (string | number | boolean)[] {
    if (str === null || str === undefined) return [];
    // Empty string should not be parsed as containing an empty string
    // since empty arrays don't get reflected (handled by the reflection logic)
    if (str === '') return [];
    
    return str.split(SimpleArray.SEPARATOR).map(item => {
      // Try to parse as number
      if (/^-?\d+\.?\d*$/.test(item)) {
        const num = Number(item);
        if (!isNaN(num)) return num;
      }
      
      // Parse as boolean
      if (item === 'true') return true;
      if (item === 'false') return false;
      
      // Default to string
      return item;
    });
  }
}

export interface PropertyOptions {
  type?: StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor | DateConstructor | BigIntConstructor | typeof SimpleArray;
  reflect?: boolean;
  attribute?: string | boolean;
  converter?: PropertyConverter;
  hasChanged?: (value: any, oldValue: any) => boolean;
}

export interface PropertyConverter {
  fromAttribute?(value: string | null, type?: any): any;
  toAttribute?(value: any, type?: any): string | null;
}

/**
 * Interface for Snice elements with all the framework-provided properties and methods
 */
export interface SniceElement extends HTMLElement {
  ready: Promise<void>;
  html?(): string | Promise<string>;
  css?(): string | string[] | Promise<string | string[]>;
}

export interface PartOptions {
  throttle?: number; // Throttle in milliseconds - limits calls to once per interval
  debounce?: number; // Debounce in milliseconds - delays execution until after calls stop
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
        // Check if this is a controller using the symbol
        const isController = this[IS_CONTROLLER_INSTANCE] === true;
        let targetElement = isController && this.element ? this.element : this;
        
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

/**
 * Decorator for methods that render specific parts of the template
 * Parts are identified by the 'part' attribute in the HTML template
 * When the decorated method is called, it automatically re-renders its part
 */
export function part(partName: string, options: PartOptions = {}) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const constructor = target.constructor;

    // Handle case where descriptor might be undefined (TypeScript experimental decorators)
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, methodName) || {
        value: target[methodName],
        writable: true,
        enumerable: true,
        configurable: true
      };
    }

    const originalMethod = descriptor.value;
    
    if (!constructor[PARTS]) {
      constructor[PARTS] = new Map();
    }
    
    constructor[PARTS].set(partName, {
      methodName,
      method: originalMethod
    });
    
    // Wrap the original method to automatically re-render the part when called
    descriptor.value = async function (this: HTMLElement, ...args: any[]) {
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
      
      // Create the render function
      const renderPart = async () => {
        // Call the original method to get the content
        const result = originalMethod.apply(this, args);
        const content = result instanceof Promise ? await result : result;
        
        // Re-render the part if shadow DOM exists and content is defined
        if (this.shadowRoot && content !== undefined) {
          const partElement = this.shadowRoot.querySelector(`[part="${partName}"]`);
          if (partElement) {
            partElement.innerHTML = content;
          }
        }
        
        return content;
      };
      
      // Handle debounce (only if positive value)
      if (options.debounce !== undefined && options.debounce > 0) {
        if (timers.debounceTimer) {
          clearTimeout(timers.debounceTimer);
        }
        
        return new Promise((resolve) => {
          timers.debounceTimer = setTimeout(async () => {
            const result = await renderPart();
            resolve(result);
          }, options.debounce);
        });
      }
      
      // Handle throttle (only if positive value)
      if (options.throttle !== undefined && options.throttle > 0) {
        const now = Date.now();
        
        if (timers.lastThrottleCall === 0 || now - timers.lastThrottleCall >= options.throttle) {
          timers.lastThrottleCall = now;
          return await renderPart();
        } else {
          // If throttled, schedule the next call if not already scheduled
          if (!timers.throttleTimer) {
            const remainingTime = options.throttle - (now - timers.lastThrottleCall);
            timers.throttleTimer = setTimeout(async () => {
              timers.throttleTimer = null;
              timers.lastThrottleCall = Date.now();
              await renderPart();
            }, remainingTime);
          }
          // For throttled calls, don't execute the original method, just return undefined
          // The actual render will happen in the scheduled timeout
          return undefined;
        }
      }
      
      // No throttle/debounce - render immediately
      return await renderPart();
    };
    
    return descriptor;
  };
}