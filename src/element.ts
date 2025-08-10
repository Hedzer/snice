import { attachController, detachController } from './controller';
import { setupEventHandlers, cleanupEventHandlers } from './events';

export function element(tagName: string) {
  return function (constructor: any) {
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
    
    // Add controller property
    Object.defineProperty(constructor.prototype, 'controller', {
      get() {
        return this._controller;
      },
      set(value: string) {
        const oldValue = this._controller;
        this._controller = value;
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
    
    constructor.prototype.connectedCallback = function() {
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
        const htmlContent = this.html();
        if (htmlContent !== undefined) {
          shadowContent += htmlContent;
        }
      }
      
      // Add CSS after HTML (maintaining original order)
      if (this.css) {
        const cssResult = this.css();
        if (cssResult) {
          // Handle both string and array of strings
          const cssContent = Array.isArray(cssResult) ? cssResult.join('\n') : cssResult;
          // No need for scoping with Shadow DOM, but add data attribute for compatibility
          shadowContent += `<style data-component-css>${cssContent}</style>`;
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
    };
    
    constructor.prototype.disconnectedCallback = function() {
      originalDisconnectedCallback?.call(this);
      if (this._controller) {
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
    
    if (!constructor._properties) {
      constructor._properties = new Map();
    }
    
    constructor._properties.set(propertyKey, options || {});
    
    const descriptor: PropertyDescriptor = {
      get(this: any) {
        return this[`_${propertyKey}`];
      },
      set(this: any, value: any) {
        const oldValue = this[`_${propertyKey}`];
        
        // Don't update if value hasn't changed
        if (oldValue === value) return;
        
        this[`_${propertyKey}`] = value;
        
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