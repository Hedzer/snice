import { attachController, detachController } from './controller';
import { setupObservers, cleanupObservers } from './observe';
import { setupResponseHandlers, cleanupResponseHandlers } from './request-response';
import { setupEventHandlers, cleanupEventHandlers } from './on';
import { setupContextHandler, cleanupContextHandler } from './context';
import { parseAttributeValue, detectType, valueToAttribute, getAttrName, ensureSet, ensureObj, invokeWatchers, notEqual } from './utils';
import { requestRender, applyStyles, clearRenderTimers } from './render';
import { clearDispatchTimers } from './events';
import { IS_ELEMENT_CLASS, IS_CONTROLLER_INSTANCE, READY_PROMISE, READY_RESOLVE, RENDERED_PROMISE, RENDERED_RESOLVE, CONTROLLER, PROPERTIES, PROPERTY_VALUES, PROPERTIES_INITIALIZED, PRE_INIT_PROPERTY_VALUES, PROPERTY_WATCHERS, PROPERTY_DEFINERS, EXPLICITLY_SET_PROPERTIES, SETTING_FROM_PROPERTY, ROUTER_CONTEXT, READY_HANDLERS, DISPOSE_HANDLERS, RECONNECT_HANDLERS, INITIALIZED, MOVED_HANDLERS, ADOPTED_HANDLERS, MOVED_TIMERS, ADOPTED_TIMERS, RENDER_METHOD, WATCH_METHODS, READY_METHODS, DISPOSE_METHODS, RECONNECT_METHODS, MOVED_METHODS, ADOPTED_METHODS, PENDING_RECONNECT_RENDER } from './symbols';
import { QueryOptions } from './types/query-options';
import { PropertyOptions } from './types/property-options';
import { ElementOptions } from './types/element-options';
import { clearDebounceTimers, clearThrottleTimers } from './method-decorators';
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
    
    // Add all properties to observed attributes (skip attribute: false)
    const properties = constructor[PROPERTIES];
    if (properties) {
      for (const [propName, propOptions] of properties) {
        if (propOptions.attribute === false) continue;
        const attributeName = getAttrName(propOptions, propName);
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

    // Note: rendered promise is stored via symbols RENDERED_PROMISE and RENDERED_RESOLVE
    // It's not exposed as a public property - only accessible via test utilities
    // This prevents accidental misuse in production code

    // Add controller property
    Object.defineProperty(constructor.prototype, 'controller', {
      get() {
        return this[CONTROLLER];
      },
      set(value: string) {
        const oldValue = this[CONTROLLER];
        this[CONTROLLER] = value;
        if (value === oldValue) return;

        if (value) {
          attachController(this, value).catch(error => {
            console.error(`Failed to attach controller "${value}":`, error);
          });
          return;
        }

        if (oldValue) {
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
        setupEventHandlers(this, this);
        setupResponseHandlers(this, this);
        setupContextHandler(this);

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

        // Fire @reconnect handlers — for components that wire long-lived
        // global listeners or subscriptions in @ready and need to re-establish
        // them on re-connection. @ready does NOT re-fire (deliberately, to
        // preserve once-only initialization semantics).
        const reconnectHandlers = constructor[RECONNECT_HANDLERS];
        if (reconnectHandlers) {
          for (const handler of reconnectHandlers) {
            try {
              const result = handler.method.call(this);
              if (result && typeof (result as any).then === 'function') {
                (result as Promise<any>).catch(error => {
                  console.error(`Error in @reconnect handler ${handler.methodName}:`, error);
                });
              }
            } catch (error) {
              console.error(`Error in @reconnect handler ${handler.methodName}:`, error);
            }
          }
        }

        // Replay a render that was dropped while disconnected. The scheduler
        // sets this flag when it skips a detached element, so a property changed
        // while detached still reaches the DOM on reattach. A plain move (no
        // pending render) leaves the flag unset, so we don't re-render needlessly.
        if (this[RENDER_METHOD] && this[PENDING_RECONNECT_RENDER]) {
          this[PENDING_RECONNECT_RENDER] = false;
          requestRender(this);
        }
        return;
      }

      // Mark that properties are being initialized from attributes
      // This allows property setters to work during initialization
      this[PROPERTIES_INITIALIZED] = true;

      // Initialize properties from attributes before rendering
      const properties = constructor[PROPERTIES];
      if (properties) {
        for (const [propName, propOptions] of properties) {
          if (propOptions.attribute === false) continue;
          const attributeName = getAttrName(propOptions, propName);
          if (!this.hasAttribute(attributeName)) continue;

          const attrValue = this.getAttribute(attributeName);
          ensureSet(this, EXPLICITLY_SET_PROPERTIES).add(propName);

          if (propOptions.type === Boolean && attrValue === '') {
            this.setAttribute(attributeName, 'true');
          }

          this[propName] = parseAttributeValue(attrValue, propOptions);
        }
      }

      // Clear pre-init values for properties that have HTML attributes
      if (this[PRE_INIT_PROPERTY_VALUES]) {
        for (const [propName, propValue] of Array.from((this[PRE_INIT_PROPERTY_VALUES] as Map<string, any>).entries())) {
          const propOptions = properties?.get(propName);
          const attributeName = getAttrName(propOptions || {}, propName);
          this[PRE_INIT_PROPERTY_VALUES].delete(propName);

          if (!this.hasAttribute(attributeName)) {
            this[propName] = propValue;
          }
        }
        delete this[PRE_INIT_PROPERTY_VALUES];
      }

      // Pick up a `controller` attribute set before connection. Real browsers
      // fire attributeChangedCallback on connect for all observed attrs that
      // already existed; happy-dom doesn't always, so we read it proactively.
      if (this.hasAttribute('controller') && !this[CONTROLLER]) {
        const controllerName = this.getAttribute('controller');
        if (controllerName) (this as any).controller = controllerName;
      }

      applyStyles(this);

      setupEventHandlers(this, this);
      setupResponseHandlers(this, this);
      setupContextHandler(this);

      this[INITIALIZED] = true;

      if (originalConnectedCallback) {
        originalConnectedCallback.call(this);
      }
      // v4.16.1: Render, run @ready handlers, THEN resolve .ready promise
      // This ensures `await el.ready` waits for both initial render AND all async @ready() methods
      //
      // We await a microtask boundary (to defer render for parent property bindings),
      // then run render + @ready handlers sequentially, then resolve .ready.
      const readyHandlers = constructor[READY_HANDLERS];

      // Await one microtask to defer initial render (allows parent property bindings)
      await new Promise<void>(r => queueMicrotask(r));

      // If the element was removed during the microtask gap, don't render,
      // don't run @ready on an orphan. Resolve ready so any awaiters don't
      // hang — the element exists, it just isn't in the DOM.
      if (!this.isConnected) {
        if (this[READY_RESOLVE]) {
          this[READY_RESOLVE]();
          this[READY_RESOLVE] = null;
        }
        return;
      }

      if (this[RENDER_METHOD]) {
        requestRender(this, true);
      }

      // Setup observers after render so shadow DOM content exists
      try {
        setupObservers(this, this);
      } catch (error) {
        console.error(`Error setting up observers for ${this.tagName}:`, error);
      }

      // Yield a microtask so child elements' microtask-deferred renders
      // complete before @ready handlers run. Children queued their render
      // microtask when they connected (earlier in the queue), so they
      // drain before this one.
      await new Promise<void>(r => queueMicrotask(r));

      // Element may have been removed during the second microtask gap.
      if (!this.isConnected) {
        if (this[READY_RESOLVE]) {
          this[READY_RESOLVE]();
          this[READY_RESOLVE] = null;
        }
        return;
      }

      // Run @ready handlers serially, awaiting each
      if (readyHandlers) {
        for (const handler of readyHandlers) {
          try {
            await handler.method.call(this);
          } catch (error) {
            console.error(`Error in @ready handler ${handler.methodName}:`, error);
          }
        }
      }

      // NOW resolve — render done AND all @ready handlers complete
      if (this[READY_RESOLVE]) {
        this[READY_RESOLVE]();
        this[READY_RESOLVE] = null;
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
      // Cleanup @on event handlers (v2.5.4 compatibility restored!)
      cleanupEventHandlers(this);
      // Cleanup @respond handlers
      cleanupResponseHandlers(this);
      // Cleanup @context handler
      cleanupContextHandler(this);
      // Cleanup @observe observers
      cleanupObservers(this);
      // Cleanup pending @debounce / @throttle timers so they don't fire on a dead element
      clearDebounceTimers(this);
      clearThrottleTimers(this);
      // The render/dispatch debounce-throttle timers live in separate stores.
      // A pending render is replayed on reconnect (same flag the scheduler
      // uses); a pending dispatch is a one-shot signal, so it's dropped.
      if (clearRenderTimers(this)) {
        (this as any)[PENDING_RECONNECT_RENDER] = true;
      }
      clearDispatchTimers(this);
      // @moved / @adopted debounce-throttle timers, likewise dropped so they
      // don't fire on a dead element.
      clearLifecycleTimers(this, MOVED_TIMERS);
      clearLifecycleTimers(this, ADOPTED_TIMERS);
    };
    
    constructor.prototype.attributeChangedCallback = function(name: string, oldValue: string, newValue: string) {
      originalAttributeChangedCallback?.call(this, name, oldValue, newValue);

      if (name === 'controller') {
        this.controller = newValue;
        return;
      }

      const properties = constructor[PROPERTIES];
      if (!properties) return;

      for (const [propName, propOptions] of properties) {
        const attributeName = getAttrName(propOptions, propName);
        if (attributeName.toLowerCase() !== name.toLowerCase()) continue;

        const currentValue = this[PROPERTY_VALUES]?.[propName];
        const parsedValue = parseAttributeValue(newValue, propOptions, currentValue, undefined);

        const changed = propOptions?.hasChanged
          ? propOptions.hasChanged(parsedValue, currentValue)
          : notEqual(parsedValue, currentValue);
        if (!changed) break;

        ensureSet(this, EXPLICITLY_SET_PROPERTIES).add(propName);
        ensureObj(this, PROPERTY_VALUES)[propName] = parsedValue;

        if (!this[SETTING_FROM_PROPERTY]?.has(name.toLowerCase())) {
          invokeWatchers(this, constructor, propName, currentValue, parsedValue);

          if (this[RENDER_METHOD] && this[INITIALIZED]) {
            requestRender(this);
          }
        }
        break;
      }
    };

    // Add connectedMoveCallback for handling DOM moves
    constructor.prototype.connectedMoveCallback = async function() {
      // Call @moved handlers via the prototype method (the debounce/throttle
      // wrapper), not the raw handler — otherwise @moved({debounce}) options
      // are ignored for real moves and only work when called directly.
      const movedHandlers = constructor[MOVED_HANDLERS];
      if (movedHandlers) {
        for (const handler of movedHandlers) {
          try {
            await (this as any)[handler.methodName]();
          } catch (error) {
            console.error(`Error in @moved handler ${handler.methodName}:`, error);
          }
        }
      }
    };

    // Add adoptedCallback for handling document adoption
    constructor.prototype.adoptedCallback = async function() {
      // Call @adopted handlers via the prototype method (the debounce/throttle
      // wrapper), not the raw handler — same reason as connectedMoveCallback.
      const adoptedHandlers = constructor[ADOPTED_HANDLERS];
      if (adoptedHandlers) {
        for (const handler of adoptedHandlers) {
          try {
            await (this as any)[handler.methodName]();
          } catch (error) {
            console.error(`Error in @adopted handler ${handler.methodName}:`, error);
          }
        }
      }
    };
}

/**
 * Walk the prototype chain and merge parent element metadata into the child.
 * Called once at class definition time — zero per-instance cost.
 * Skips plain HTMLElement (no metadata to merge).
 *
 * Only merges PROPERTIES (stored via context.metadata at decoration time)
 * and formAssociated. Other handler registrations (@watch, @on, @ready, etc.)
 * inherit automatically via TC39 addInitializer — parent initializers run
 * during child instance construction.
 */
function mergeParentMetadata(constructor: any) {
  let parent = Object.getPrototypeOf(constructor);

  // Collect ancestors bottom-up, then merge top-down so the deepest parent goes first
  const ancestors: any[] = [];
  while (parent && parent !== HTMLElement && parent !== Function.prototype) {
    ancestors.push(parent);
    parent = Object.getPrototypeOf(parent);
  }
  ancestors.reverse();

  for (const ancestor of ancestors) {
    // Properties (Map) — parent first, child overrides
    if (ancestor[PROPERTIES]) {
      if (!constructor[PROPERTIES]) constructor[PROPERTIES] = new Map();
      for (const [key, value] of ancestor[PROPERTIES]) {
        if (!constructor[PROPERTIES].has(key)) {
          constructor[PROPERTIES].set(key, value);
        }
      }
    }

    // formAssociated — inherit if parent is form-associated
    if (ancestor.formAssociated && !constructor.formAssociated) {
      constructor.formAssociated = true;
    }
  }
}

function defineElement(tagName: string, constructor: any, context: ClassDecoratorContext, options?: ElementOptions) {
  // Merge metadata from parent @element classes (inheritance support)
  mergeParentMetadata(constructor);

  if (context.metadata && (context.metadata as any)[PROPERTIES]) {
    if (!constructor[PROPERTIES]) constructor[PROPERTIES] = new Map();
    for (const [key, value] of (context.metadata as any)[PROPERTIES]) {
      constructor[PROPERTIES].set(key, value);
    }
  } else if (_pendingProperties.length > 0) {
    // Symbol.metadata unavailable — drain the pending stack
    if (!constructor[PROPERTIES]) constructor[PROPERTIES] = new Map();
    const pending = _pendingProperties.pop()!;
    for (const [key, value] of pending) {
      constructor[PROPERTIES].set(key, value);
    }
  }
  if (options?.formAssociated) constructor.formAssociated = true;
  applyElementFunctionality(constructor);
  if (customElements.get(tagName)) {
    if ((globalThis as any).SNICE_DEBUG) console.warn(`[snice] "${tagName}" is already registered. Skipping.`);
    return constructor;
  }
  customElements.define(tagName, constructor);
  return constructor;
}

export function element(tagName: string, options?: ElementOptions) {
  return function (constructor: any, context: ClassDecoratorContext) {
    return defineElement(tagName, constructor, context, options);
  };
}

export function layout(tagName: string) {
  return function (constructor: any, context: ClassDecoratorContext) {
    return defineElement(tagName, constructor, context);
  };
}
// Fallback stack for environments where Symbol.metadata is unavailable.
// @property pushes entries; @element pops them. Works because field decorators
// run synchronously before the class decorator in the same static block.
const _pendingProperties: Map<string, PropertyOptions>[] = [];

export function property(options?: PropertyOptions) {
  return function (_value: any, context: ClassFieldDecoratorContext) {
    const propertyKey = context.name as string;
    // Use metadata to store property information at decoration time
    if (context.metadata) {
      if (!(context.metadata as any)[PROPERTIES]) {
        (context.metadata as any)[PROPERTIES] = new Map();
      }
      (context.metadata as any)[PROPERTIES].set(propertyKey, options || {});
    } else {
      // Symbol.metadata unavailable — use the pending stack instead
      if (_pendingProperties.length === 0) _pendingProperties.push(new Map());
      _pendingProperties[_pendingProperties.length - 1].set(propertyKey, options || {});
    }


    // Return a field initializer function for new decorators
    return function(this: any, initialValue: any) {
      // Ensure constructor[PROPERTIES] exists
      const constructor = this.constructor as any;
      if (!constructor[PROPERTIES]) {
        constructor[PROPERTIES] = new Map();
      }

      // Detect type from initial value if not explicitly provided
      const finalOptions = { ...options };
      if (!finalOptions.type && initialValue !== undefined) {
        finalOptions.type = detectType(initialValue);
      }

      // Always store property options on constructor for runtime access
      constructor[PROPERTIES].set(propertyKey, finalOptions);

      // Set up the property descriptor — re-define if a subclass overrides
      // the property with different options (different closure captures).
      // Per-key options tracked on the prototype via a Symbol map.
      const proto = this.constructor.prototype;
      let definers: Map<string, any> | undefined = proto[PROPERTY_DEFINERS];
      if (!definers || !Object.prototype.hasOwnProperty.call(proto, PROPERTY_DEFINERS)) {
        definers = new Map(definers);
        proto[PROPERTY_DEFINERS] = definers;
      }
      const existingDefiner = definers.get(propertyKey);
      if (!existingDefiner || existingDefiner !== options) {
        definers.set(propertyKey, options);
        const descriptor: PropertyDescriptor = {
          get(this: any) {
            // attribute: false — use internal storage only, no DOM sync
            if (finalOptions?.attribute === false) {
              if (this[PROPERTY_VALUES] && propertyKey in this[PROPERTY_VALUES]) {
                return this[PROPERTY_VALUES][propertyKey];
              }
              if (this[PRE_INIT_PROPERTY_VALUES]?.has(propertyKey)) {
                return this[PRE_INIT_PROPERTY_VALUES].get(propertyKey);
              }
              return initialValue;
            }

            // Always read from DOM attribute - no internal state
            const attributeName = getAttrName(finalOptions || {}, propertyKey);
            const attrValue = this.getAttribute?.(attributeName);

            // If attribute exists, parse it
            if (attrValue !== null) {
              return parseAttributeValue(attrValue, finalOptions || {}, undefined, initialValue);
            }

            // For Boolean properties that have been explicitly set via attribute (and then removed),
            // follow HTML boolean attribute semantics (absence = false)
            const inferredType = finalOptions?.type || detectType(initialValue);
            if (inferredType === Boolean && this[EXPLICITLY_SET_PROPERTIES]?.has(propertyKey)) {
              return false;
            }

            // Check for pre-init property values (set before element was connected)
            if (this[PRE_INIT_PROPERTY_VALUES]?.has(propertyKey)) {
              return this[PRE_INIT_PROPERTY_VALUES].get(propertyKey);
            }

            // Otherwise return initial value (respects default values like showRememberMe = true)
            return initialValue;
          },
          set(this: any, newValue: any) {
            const oldValue = this[propertyKey];
            // A custom hasChanged comparator overrides the default === check
            // (e.g. deep-equal objects, or forcing an update on a mutated ref).
            const changed = finalOptions?.hasChanged
              ? finalOptions.hasChanged(newValue, oldValue)
              : notEqual(newValue, oldValue);
            if (!changed) return;

            // Pre-init: store for later, don't reflect to DOM yet
            if (!this[PROPERTIES_INITIALIZED]) {
              if (!this[PRE_INIT_PROPERTY_VALUES]) this[PRE_INIT_PROPERTY_VALUES] = new Map();
              this[PRE_INIT_PROPERTY_VALUES].set(propertyKey, newValue);
              return;
            }

            // attribute: false — store internally, skip DOM reflection
            if (finalOptions?.attribute === false) {
              ensureObj(this, PROPERTY_VALUES)[propertyKey] = newValue;
            } else {
              const attributeName = getAttrName(finalOptions, propertyKey);
              const attributeValue = valueToAttribute(newValue, finalOptions, initialValue);

              ensureSet(this, EXPLICITLY_SET_PROPERTIES).add(propertyKey);
              ensureSet(this, SETTING_FROM_PROPERTY).add(attributeName.toLowerCase());

              if (attributeValue === null) {
                this.removeAttribute?.(attributeName);
              } else {
                this.setAttribute?.(attributeName, attributeValue);
              }

              queueMicrotask(() => {
                this[SETTING_FROM_PROPERTY]?.delete(attributeName.toLowerCase());
              });
            }

            invokeWatchers(this, this.constructor, propertyKey, oldValue, newValue);

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
      ensureObj(this, PROPERTY_VALUES)[propertyKey] = initialValue;
      return initialValue;
    };
  };
}


function getQueryRoot(instance: any): any {
  const isController = instance[IS_CONTROLLER_INSTANCE] === true;
  return isController && instance.element ? instance.element : instance;
}

export function query(selector: string, options: QueryOptions = {}) {
  return function (_value: any, context: ClassFieldDecoratorContext) {
    const { light = false, shadow = true } = options;
    const propertyKey = context.name as string;

    return function(this: any, initialValue: any) {
      if (!Object.hasOwn(this.constructor.prototype, propertyKey)) {
        Object.defineProperty(this.constructor.prototype, propertyKey, {
          get() {
            const root = getQueryRoot(this);
            let result = null;
            if (shadow && root.shadowRoot) result = root.shadowRoot.querySelector(selector);
            if (!result && light) result = root.querySelector(selector);
            return result || null;
          },
          set() {},
          configurable: true,
          enumerable: true
        });
      }
      return initialValue;
    };
  };
}

export function queryAll(selector: string, options: QueryOptions = {}) {
  return function (_value: any, context: ClassFieldDecoratorContext) {
    const { light = false, shadow = true } = options;
    const propertyKey = context.name as string;

    return function(this: any, initialValue: any) {
      if (!Object.hasOwn(this.constructor.prototype, propertyKey)) {
        Object.defineProperty(this.constructor.prototype, propertyKey, {
          get() {
            const root = getQueryRoot(this);
            const results: Element[] = [];
            if (shadow && root.shadowRoot) results.push(...root.shadowRoot.querySelectorAll(selector));
            if (light) results.push(...root.querySelectorAll(selector));
            return results as any as NodeListOf<Element>;
          },
          set() {},
          configurable: true,
          enumerable: true
        });
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

      // Dedup by (method reference, propertyName) so that multiple @watch
      // decorators on the same method register for each key independently,
      // while still preventing duplicate registration when child classes
      // inherit/override a method with the same name. Use hasOwnProperty so
      // subclasses get their OWN Map — otherwise child pushes into the
      // parent's PROPERTY_WATCHERS via the prototype chain.
      if (!Object.prototype.hasOwnProperty.call(constructor, WATCH_METHODS)) {
        constructor[WATCH_METHODS] = new Map();
      }
      let registered: Set<string> = constructor[WATCH_METHODS].get(target);
      if (!registered) {
        registered = new Set<string>();
        constructor[WATCH_METHODS].set(target, registered);
      }

      if (!Object.prototype.hasOwnProperty.call(constructor, PROPERTY_WATCHERS)) {
        // Deep-copy the inherited Map so the child starts with the parent's
        // watchers but pushing to a propertyName's array on the child doesn't
        // mutate the parent's array.
        const inherited: Map<string, any[]> | undefined = constructor[PROPERTY_WATCHERS];
        const copy = new Map<string, any[]>();
        if (inherited) {
          for (const [key, arr] of inherited) copy.set(key, [...arr]);
        }
        constructor[PROPERTY_WATCHERS] = copy;
      }

      for (const propertyName of propertyNames) {
        if (registered.has(propertyName)) continue;
        registered.add(propertyName);

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
      if (!Object.hasOwn(this.constructor.prototype, propertyKey)) {
        const descriptor: PropertyDescriptor = {
          get() {
            // Cached context
            if ((this as any)[ROUTER_CONTEXT] !== undefined) {
              return (this as any)[ROUTER_CONTEXT];
            }

            // Resolve dispatch target
            const isController = (this as any)[IS_CONTROLLER_INSTANCE] === true;
            let targetElement = isController && (this as any).element ? (this as any).element : this;

            // Controller was detached
            if (!targetElement || !targetElement.dispatchEvent) return undefined;

            // Shadow DOM: dispatch on host for proper bubbling
            if (targetElement.getRootNode && targetElement.getRootNode() instanceof ShadowRoot) {
              targetElement = (targetElement.getRootNode() as ShadowRoot).host as HTMLElement;
            }

            // Request context from parent page
            const detail: any = { target: this };
            targetElement.dispatchEvent(new CustomEvent('@context/request', {
              bubbles: true,
              cancelable: true,
              detail
            }));

            // No context provided
            if (detail.context === undefined) return undefined;

            // Cache and return
            (this as any)[ROUTER_CONTEXT] = detail.context;
            return detail.context;
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

function registerHandler(handlersSymbol: symbol, methodsSymbol: symbol, target: any, context: ClassMethodDecoratorContext, extra?: any) {
  const methodName = context.name as string;
  context.addInitializer(function(this: any) {
    const constructor = this.constructor as any;
    // hasOwnProperty guards so subclasses get their OWN Set/array instead of
    // mutating the parent's via the prototype chain.
    if (!Object.prototype.hasOwnProperty.call(constructor, methodsSymbol)) {
      constructor[methodsSymbol] = new Set();
    }
    if (constructor[methodsSymbol].has(target)) return;
    constructor[methodsSymbol].add(target);
    if (!Object.prototype.hasOwnProperty.call(constructor, handlersSymbol)) {
      const inherited = constructor[handlersSymbol];
      constructor[handlersSymbol] = inherited ? [...inherited] : [];
    }
    constructor[handlersSymbol].push({ methodName, method: target, ...extra });
  });
}

export function ready() {
  return function (target: any, context: ClassMethodDecoratorContext) {
    registerHandler(READY_HANDLERS, READY_METHODS, target, context);
  };
}

export function dispose() {
  return function (target: any, context: ClassMethodDecoratorContext) {
    registerHandler(DISPOSE_HANDLERS, DISPOSE_METHODS, target, context);
  };
}

/**
 * Fires every time the element is connected AFTER the first connect.
 *
 * `@ready` only fires once (after the initial render). `@dispose` fires on
 * every disconnect. The gap between them is "what should run on a
 * reconnect?" For most components, framework-managed pieces (`@on`,
 * `@observe`, `@respond`, `@context`) are re-established automatically
 * and nothing else is needed.
 *
 * Use `@reconnect` only when the component wires its OWN long-lived global
 * subscription in `@ready` (e.g. a `document.addEventListener` for
 * outside-click detection) and tears it down in `@dispose`. The framework
 * doesn't track those, so they need a hook to re-attach on reconnect.
 *
 * Counterpart to `@dispose`. Symmetric.
 */
export function reconnect() {
  return function (target: any, context: ClassMethodDecoratorContext) {
    registerHandler(RECONNECT_HANDLERS, RECONNECT_METHODS, target, context);
  };
}

/**
 * Clear any pending @moved / @adopted debounce/throttle timers on an instance
 * (e.g. on disconnect), so they don't fire on a dead element.
 */
function clearLifecycleTimers(instance: any, timersSymbol: symbol): void {
  const map = instance[timersSymbol];
  if (!map) return;

  for (const t of map.values()) {
    if (t.debounceTimer) clearTimeout(t.debounceTimer);
    if (t.throttleTimer) clearTimeout(t.throttleTimer);
    t.debounceTimer = null;
    t.throttleTimer = null;
    t.lastThrottleCall = 0;
  }
}

function createLifecycleDecorator(handlersSymbol: symbol, timersSymbol: symbol, methodsSymbol: symbol) {
  return function (options: any = {}) {
    return function (originalMethod: any, context: ClassMethodDecoratorContext) {
      registerHandler(handlersSymbol, methodsSymbol, originalMethod, context, { options });

      const methodName = context.name as string;

      return function (this: HTMLElement, ...args: any[]) {
        if (!(this as any)[timersSymbol]) (this as any)[timersSymbol] = new Map();
        if (!(this as any)[timersSymbol].has(methodName)) {
          (this as any)[timersSymbol].set(methodName, { throttleTimer: null, debounceTimer: null, lastThrottleCall: 0 });
        }

        const timers = (this as any)[timersSymbol].get(methodName);
        const exec = (...a: any[]) => originalMethod.apply(this, a);
        // Deferred (debounce/throttle) calls run inside a setTimeout, outside
        // the caller's try/catch — so catch their sync throws and async
        // rejections here and log, rather than surface an uncaught error.
        const execDeferred = (...a: any[]) => {
          try {
            const result = originalMethod.apply(this, a);
            if (result && typeof result.then === 'function') {
              (result as Promise<any>).catch((error) =>
                console.error(`Error in deferred lifecycle handler ${methodName}:`, error)
              );
            }
          } catch (error) {
            console.error(`Error in deferred lifecycle handler ${methodName}:`, error);
          }
        };

        if (options.debounce > 0) {
          clearTimeout(timers.debounceTimer);
          timers.debounceTimer = setTimeout(() => execDeferred(...args), options.debounce);
          return undefined;
        }

        if (options.throttle > 0) {
          const now = Date.now();
          if (timers.lastThrottleCall === 0 || now - timers.lastThrottleCall >= options.throttle) {
            timers.lastThrottleCall = now;
            return exec(...args);
          }
          if (!timers.throttleTimer) {
            const remaining = options.throttle - (now - timers.lastThrottleCall);
            timers.throttleTimer = setTimeout(() => {
              timers.throttleTimer = null;
              timers.lastThrottleCall = Date.now();
              execDeferred(...args);
            }, remaining);
          }
          return undefined;
        }

        return exec(...args);
      };
    };
  };
}

export const moved = createLifecycleDecorator(MOVED_HANDLERS, MOVED_TIMERS, MOVED_METHODS);
export const adopted = createLifecycleDecorator(ADOPTED_HANDLERS, ADOPTED_TIMERS, ADOPTED_METHODS);