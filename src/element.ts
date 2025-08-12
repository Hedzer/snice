import { attachController, detachController } from './controller';
import { setupEventHandlers, cleanupEventHandlers } from './events';
import { IS_ELEMENT_CLASS, READY_PROMISE, READY_RESOLVE, CONTROLLER, PROPERTIES, PROPERTY_VALUES } from './symbols';

export function element(tagName: string) {
  return function (constructor: any) {
    // Mark as element class for channel decorator detection
    (constructor.prototype as any)[IS_ELEMENT_CLASS] = true;
    
    // Add controller property to all elements
    const originalConnectedCallback = constructor.prototype.connectedCallback;
    const originalDisconnectedCallback = constructor.prototype.disconnectedCallback;
    const originalAttributeChangedCallback = constructor.prototype.attributeChangedCallback;
    
    // Add 'controller' to observed attributes
    const observedAttributes = constructor.observedAttributes || [];
    if (!observedAttributes.includes('controller')) {
      observedAttributes.push('controller');
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
        
        originalConnectedCallback?.call(this);
        
        const controllerName = this.getAttribute('controller');
        if (controllerName) {
          this.controller = controllerName;
        }
        // Setup @on event handlers - use element for host events, shadow root for delegated events
        setupEventHandlers(this, this);
      } finally {
        // Always mark element as ready, even if there were errors
        if (this[READY_RESOLVE]) {
          this[READY_RESOLVE]();
          this[READY_RESOLVE] = null; // Clear the resolver
        }
      }
    };
    
    constructor.prototype.disconnectedCallback = function() {
      originalDisconnectedCallback?.call(this);
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
      }
    };
    
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
        const oldValue = this[PROPERTY_VALUES][propertyKey];
        
        // Don't update if value hasn't changed
        if (oldValue === value) return;
        
        this[PROPERTY_VALUES][propertyKey] = value;
        
        if (options?.reflect && this.setAttribute) {
          if (value === null || value === undefined || value === false) {
            this.removeAttribute(options.attribute || propertyKey);
          } else {
            this.setAttribute(options.attribute || propertyKey, String(value));
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

export function query(selector: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        // For elements with shadow DOM, query within shadow root
        // For controllers, check the element's shadow root first
        const root = this.element || this;
        if (root.shadowRoot) {
          return root.shadowRoot.querySelector(selector);
        }
        return root.querySelector(selector);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export function queryAll(selector: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        // For elements with shadow DOM, query within shadow root
        // For controllers, check the element's shadow root first
        const root = this.element || this;
        if (root.shadowRoot) {
          return root.shadowRoot.querySelectorAll(selector);
        }
        return root.querySelectorAll(selector);
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