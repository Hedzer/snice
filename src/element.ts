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
          attachController(this, value).catch(error => {
            console.error(`Failed to attach controller "${value}":`, error);
          });
        } else if (!value && oldValue) {
          detachController(this).catch(error => {
            console.error(`Failed to detach controller:`, error);
          });
        }
      },
      enumerable: true,
      configurable: true
    });
    
    constructor.prototype.connectedCallback = function() {
      // Check if there's html method
      if (this.html) {
        const htmlContent = this.html();
        if (htmlContent !== undefined) {
          this.innerHTML = htmlContent;
        }
      }
      
      // Check if there's css method - MUST come after HTML
      if (this.css) {
        const cssResult = this.css();
        if (cssResult) {
          // Handle both string and array of strings
          const cssContent = Array.isArray(cssResult) ? cssResult.join('\n') : cssResult;
          
          // Check if style doesn't already exist
          let styleEl = this.querySelector('style[data-component-css]');
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.setAttribute('data-component-css', '');
            // Add scoping to the component
            const scopedCss = cssContent.replace(/([^{}]+){/g, (match: string, selector: string) => {
              // Don't scope keyframes or media queries
              if (selector.includes('@')) return match;
              // Add the tag name as a scope
              return `${tagName} ${selector.trim()} {`;
            });
            styleEl.textContent = scopedCss;
            this.appendChild(styleEl);
          }
        }
      }
      
      originalConnectedCallback?.call(this);
      const controllerName = this.getAttribute('controller');
      if (controllerName) {
        this.controller = controllerName;
      }
      // Setup @on event handlers
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
        this[`_${propertyKey}`] = value;
        
        if (options?.reflect && this.setAttribute) {
          if (value === null || value === undefined || value === false) {
            this.removeAttribute(options.attribute || propertyKey);
          } else {
            this.setAttribute(options.attribute || propertyKey, String(value));
          }
        }
        
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
        // Check if this is a controller (has .element) or a custom element
        const root = this.element || this;
        return root.shadowRoot?.querySelector(selector) || root.querySelector(selector);
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
        // Check if this is a controller (has .element) or a custom element
        const root = this.element || this;
        return root.shadowRoot?.querySelectorAll(selector) || root.querySelectorAll(selector);
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