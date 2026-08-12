import { attachController, deferControllerAttachment, detachController, restoreDirectControllerAttribute } from './controller';
import { ControllerClass } from './types/i-controller';
import { setupObservers, cleanupObservers } from './observe';
import { setupResponseHandlers, cleanupResponseHandlers } from './request-response';
import { setupEventHandlers, cleanupEventHandlers } from './on';
import { setupContextHandler, cleanupContextHandler } from './context';
import { parseAttributeValue, detectType, valueToAttribute, getAttrName, ensureSet, ensureObj, invokeWatchers, invokeImmediateWatchers, validateWatchedProperties, notEqual } from './utils';
import { requestRender, applyStyles, clearRenderTimers, disconnectRenderTree, reconnectRenderTree } from './render';
import { activateDispatchTimers, beginDispatchTeardown, createDispatchTeardownContext, finishDispatchTeardown } from './events';
import { IS_ELEMENT_CLASS, IS_CONTROLLER_INSTANCE, READY_PROMISE, READY_RESOLVE, READY_REJECT, READY_HANDLERS_RUNNING, RENDERED_PROMISE, RENDERED_RESOLVE, CONTROLLER, DIRECT_CONTROLLER, CONTROLLER_ATTRIBUTE_SYNC, PENDING_CONTROLLER_BINDING, PROPERTIES, PROPERTY_VALUES, PROPERTY_DEFAULTS, PROPERTY_WRAPPERS, PROPERTIES_INITIALIZED, PRE_INIT_PROPERTY_VALUES, PRE_UPGRADE_PROPERTY_BINDINGS, PROPERTY_WATCHERS, PROPERTY_DEFINERS, EXPLICITLY_SET_PROPERTIES, SETTING_FROM_PROPERTY, ROUTER_CONTEXT, READY_HANDLERS, DISPOSE_HANDLERS, RECONNECT_HANDLERS, INITIALIZED, MOVED_HANDLERS, ADOPTED_HANDLERS, MOVED_TIMERS, ADOPTED_TIMERS, RENDER_METHOD, RENDER_OPTIONS, ELEMENT_OPTIONS, WATCH_METHODS, READY_METHODS, DISPOSE_METHODS, RECONNECT_METHODS, MOVED_METHODS, ADOPTED_METHODS, PENDING_RECONNECT_RENDER, SNICE_ELEMENT_BASE } from './symbols';
import { QueryOptions } from './types/query-options';
import { PropertyOptions, StateOptions } from './types/property-options';
import { WatchOptions } from './types/watch-options';
import { ElementOptions } from './types/element-options';
import { clearDebounceTimers, clearThrottleTimers } from './method-decorators';
import { AppContext } from './types/app-context';
import { Placard } from './types/placard';
import { RouteParams } from './types/route-params';
import { createDeepReactive } from './reactive';
import { ensureRenderRoot, getRenderRoot } from './render-root';
import { getContext as getAppContext } from './context-provider';
import { resetHostAutofocus, scheduleAutofocus } from './autofocus';

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
    
    // Add framework-managed native/controller attributes and all reflected properties
    const observedAttributes = constructor.observedAttributes || [];
    if (!observedAttributes.includes('controller')) {
      observedAttributes.push('controller');
    }
    if (!observedAttributes.includes('autofocus')) {
      observedAttributes.push('autofocus');
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
          this[READY_PROMISE] = new Promise<void>((resolve, reject) => {
            this[READY_RESOLVE] = resolve;
            this[READY_REJECT] = reject;
          });
          // Preserve a rejected ready promise for explicit awaiters without
          // producing an unhandled rejection when nobody reads `.ready`.
          this[READY_PROMISE].catch(() => {});
        }
        return this[READY_PROMISE];
      },
      enumerable: true,
      configurable: true
    });

    // Add rendered property - resolves when the pending render (batched,
    // debounced, or throttled) has committed to the DOM; resolves
    // immediately when no render is pending.
    Object.defineProperty(constructor.prototype, 'rendered', {
      get() {
        return this[RENDERED_RESOLVE] ? this[RENDERED_PROMISE] : Promise.resolve();
      },
      enumerable: true,
      configurable: true
    });

    // Add controller property
    Object.defineProperty(constructor.prototype, 'controller', {
      get() {
        return this[CONTROLLER];
      },
      set(value: string | ControllerClass | null) {
        const oldValue = this[CONTROLLER];
        this[CONTROLLER] = value;
        if (value === oldValue) return;

        if (value) {
          const label = typeof value === 'string' ? value : (value.name || '(anonymous controller class)');
          attachController(this, value).catch(error => {
            // Detached before ready — designed teardown, not a failure
            if (error?.name === 'ControllerAttachAborted') {
              console.debug(`Controller "${label}" attach aborted (element detached before ready)`);
              return;
            }
            // Registry misses only apply to string names — class references
            // never go through the registry.
            if (typeof value === 'string' && error?.message === `Controller "${value}" not found in registry`) {
              deferControllerAttachment(this, value);
              return;
            }
            console.error(`Failed to attach controller "${label}":`, error);
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
      activateDispatchTimers(this);

      // If ready promise was already created (controller attached before connected), use existing resolve
      // Otherwise create the ready promise now
      if (!this[READY_PROMISE]) {
        this[READY_PROMISE] = new Promise<void>((resolve, reject) => {
          this[READY_RESOLVE] = resolve;
          this[READY_REJECT] = reject;
        });
        this[READY_PROMISE].catch(() => {});
      }

      // Only run initialization logic once, but re-establish handlers on reconnection
      if (this[INITIALIZED]) {
        try {
          reconnectRenderTree(this);
        } catch (error) {
          console.error(`Error reconnecting the render tree for ${this.tagName}:`, error);
        }
        // Re-establish handlers that get cleaned up on disconnect
        setupEventHandlers(this, this);
        setupResponseHandlers(this, this);
        void setupContextHandler(this, 'task');

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
        scheduleAutofocus(this);
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

      // Pick up a controller CLASS a template bound before this element was
      // defined. The binding parks the class instead of assigning the
      // property — a pre-upgrade assignment would have shadowed this accessor
      // with an own expando property. Attach directly rather than through the
      // `controller` accessor: some DOM implementations (happy-dom) invoke
      // connectedCallback on define without swapping the prototype, so the
      // accessor may not exist on this instance yet.
      if (this[PENDING_CONTROLLER_BINDING] !== undefined) {
        const pendingControllerClass = this[PENDING_CONTROLLER_BINDING];
        delete this[PENDING_CONTROLLER_BINDING];
        if (!this[CONTROLLER]) {
          this[CONTROLLER] = pendingControllerClass;
          const pendingLabel = pendingControllerClass?.name || '(anonymous controller class)';
          attachController(this, pendingControllerClass).catch((error: any) => {
            if (error?.name === 'ControllerAttachAborted') {
              console.debug(`Controller "${pendingLabel}" attach aborted (element detached before ready)`);
              return;
            }
            console.error(`Failed to attach controller "${pendingLabel}":`, error);
          });
        }
      }

      // Pick up a `controller` attribute set before connection. Real browsers
      // fire attributeChangedCallback on connect for all observed attrs that
      // already existed; happy-dom doesn't always, so we read it proactively.
      if (this.hasAttribute('controller') && !this[CONTROLLER]) {
        const controllerName = this.getAttribute('controller');
        if (controllerName) (this as any).controller = controllerName;
      }

      applyStyles(this);

      // Delegated @on handlers must bind inside the render root. Styles used
      // to create that root as a side effect, leaving styleless renderers to
      // bind on the host before their shadow root existed. Create only for
      // declarative renderers here so imperative elements that manage their
      // own shadow root keep their established lifecycle.
      if (this[RENDER_METHOD]) {
        try {
          ensureRenderRoot(this);
        } catch {
          // Defer invalid custom-root diagnostics to the normal render path,
          // where render errors are contextualized and reported consistently.
          // There is no usable root to bind delegated handlers to in this
          // invalid configuration, but the initial render below will surface
          // the author error without escaping connectedCallback.
        }
      }

      setupEventHandlers(this, this);
      setupResponseHandlers(this, this);
      void setupContextHandler(this, 'task');

      this[INITIALIZED] = true;

      // One-time (per class) sanity check: a @watch name with no matching
      // @property never fires — surface the typo instead of staying silent.
      validateWatchedProperties(this, constructor);

      // Now that the initial value is settled, give @watch immediate handlers
      // their one init call (before the first render, so derived state is ready).
      invokeImmediateWatchers(this, constructor);

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
          this[READY_REJECT] = null;
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
          this[READY_REJECT] = null;
        }
        return;
      }

      // Run @ready handlers serially, awaiting each
      let readyFailed = false;
      let readyFailure: unknown;
      if (readyHandlers) {
        this[READY_HANDLERS_RUNNING] = true;
        try {
          for (const handler of readyHandlers) {
            try {
              await handler.method.call(this);
            } catch (error) {
              console.error(`Error in @ready handler ${handler.methodName}:`, error);
              if (!readyFailed) {
                readyFailed = true;
                readyFailure = error;
              }
            }
          }
        } finally {
          delete this[READY_HANDLERS_RUNNING];
        }
      }

      // NOW settle — render done AND every @ready handler completed. A failed
      // handler rejects the public signal instead of leaving a half-initialized
      // element indistinguishable from a successful one.
      if (readyFailed && this[READY_REJECT]) {
        this[READY_REJECT](readyFailure);
        this[READY_RESOLVE] = null;
        this[READY_REJECT] = null;
      } else if (this[READY_RESOLVE]) {
        this[READY_RESOLVE]();
        this[READY_RESOLVE] = null;
        this[READY_REJECT] = null;
      }
      scheduleAutofocus(this);
    };
    
    constructor.prototype.disconnectedCallback = async function() {
      // Invalidate queued and unresolved-async @dispatch work synchronously.
      // The platform does not await disconnectedCallback, and @dispose may be
      // async, so waiting until the end permits events from a detached host.
      const dispatchTeardownGeneration = beginDispatchTeardown(this);
      const dispatchTeardownContext = createDispatchTeardownContext(this, dispatchTeardownGeneration);
      try {
        disconnectRenderTree(this);
      } catch (error) {
        console.error(`Error disconnecting the render tree for ${this.tagName}:`, error);
      }
      // Call @dispose handlers
      const disposeHandlers = constructor[DISPOSE_HANDLERS];
      if (disposeHandlers) {
        for (const handler of disposeHandlers) {
          try {
            await handler.method.call(dispatchTeardownContext);
          } catch (error) {
            console.error(`Error in @dispose handler ${handler.methodName}:`, error);
          }
        }
      }
      
      // Call original user-defined disconnectedCallback
      if (originalDisconnectedCallback) {
        originalDisconnectedCallback.call(dispatchTeardownContext);
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
      // @moved / @adopted debounce-throttle timers, likewise dropped so they
      // don't fire on a dead element.
      clearLifecycleTimers(this, MOVED_TIMERS);
      clearLifecycleTimers(this, ADOPTED_TIMERS);
      // Hooks may have invoked @dispatch after teardown began. Invalidate only
      // that disconnected generation: a reconnect above may already own new
      // timers on the same decorated methods.
      finishDispatchTeardown(this, dispatchTeardownGeneration);
    };
    
    constructor.prototype.attributeChangedCallback = function(name: string, oldValue: string | null, newValue: string | null) {
      originalAttributeChangedCallback?.call(this, name, oldValue, newValue);

      if (name === 'controller') {
        // A class attachment reflects its decorator name for DOM diagnostics,
        // but the class reference remains the only attachment authority.
        if (this[CONTROLLER_ATTRIBUTE_SYNC]) return;
        if (this[DIRECT_CONTROLLER]) {
          restoreDirectControllerAttribute(this);
          return;
        }
        this.controller = newValue;
        return;
      }

      if (name === 'autofocus') {
        if (newValue === null) resetHostAutofocus(this);
        else if (this[INITIALIZED]) scheduleAutofocus(this);
      }

      const properties = constructor[PROPERTIES];
      if (!properties) return;

      for (const [propName, propOptions] of properties) {
        const attributeName = getAttrName(propOptions, propName);
        if (attributeName.toLowerCase() !== name.toLowerCase()) continue;

        // A property-originated reflection already stored the authoritative
        // JS value. Do not parse the serialized attribute back into a clone.
        if (this[SETTING_FROM_PROPERTY]?.has(name.toLowerCase())) break;

        const currentValue = this[PROPERTY_VALUES]?.[propName];
        // A removed attribute reverts the property to its field default. Read it
        // back through the getter (attribute is already gone at this point) so the
        // watcher's newValue and PROPERTY_VALUES match what this[propName] now
        // returns — parseAttributeValue(null) would diverge to null for String/Number.
        const defaultValue = this[PROPERTY_DEFAULTS]?.[propName];
        let parsedValue = newValue === null
          ? (propOptions.type === Boolean ? false : defaultValue)
          : parseAttributeValue(newValue, propOptions, currentValue, defaultValue);
        const wrap = this[PROPERTY_WRAPPERS]?.[propName];
        if (wrap) parsedValue = wrap(parsedValue);

        const changed = propOptions?.hasChanged
          ? propOptions.hasChanged(parsedValue, currentValue)
          : notEqual(parsedValue, currentValue);
        if (!changed) break;

        ensureSet(this, EXPLICITLY_SET_PROPERTIES).add(propName);
        ensureObj(this, PROPERTY_VALUES)[propName] = parsedValue;

        // Watchers react to changes only. During upgrade the initial value
        // is not a change, so suppress until INITIALIZED; @watch immediate
        // handlers get their one init call from invokeImmediateWatchers.
        if (this[INITIALIZED]) {
          invokeWatchers(this, constructor, propName, currentValue, parsedValue);
        }

        if (this[RENDER_METHOD] && this[INITIALIZED]) {
          requestRender(this);
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
  const inheritedOptions = {
    ...((Object.getPrototypeOf(constructor) as any)?.[ELEMENT_OPTIONS] || {})
  } as ElementOptions;
  const ownOptions = options || {};
  if (
    ownOptions.renderRoot === 'light' && typeof ownOptions.shadow === 'string' ||
    ownOptions.renderRoot === 'shadow' && ownOptions.shadow === false
  ) {
    throw new TypeError('snice: @element renderRoot and shadow options select conflicting render roots.');
  }
  const mergedOptions: ElementOptions = { ...inheritedOptions, ...ownOptions };
  if (Object.prototype.hasOwnProperty.call(ownOptions, 'shadow')) {
    mergedOptions.renderRoot = ownOptions.shadow === false ? 'light' : 'shadow';
  } else if (Object.prototype.hasOwnProperty.call(ownOptions, 'renderRoot')) {
    if (ownOptions.renderRoot === 'light') mergedOptions.shadow = false;
    else if (mergedOptions.shadow === false) mergedOptions.shadow = 'open';
  }
  constructor[ELEMENT_OPTIONS] = mergedOptions;
  if (
    (constructor.prototype as any)[SNICE_ELEMENT_BASE] === true &&
    Object.prototype.hasOwnProperty.call(constructor.prototype, 'render') &&
    !Object.prototype.hasOwnProperty.call(constructor.prototype, RENDER_METHOD) &&
    typeof constructor.prototype.render === 'function'
  ) {
    (constructor.prototype as any)[RENDER_METHOD] = constructor.prototype.render;
    (constructor.prototype as any)[RENDER_OPTIONS] = constructor.renderOptions || {};
  }
  applyElementFunctionality(constructor);
  if (customElements.get(tagName)) {
    if ((globalThis as any).SNICE_DEBUG) console.warn(`[snice] "${tagName}" is already registered. Skipping.`);
    return constructor;
  }
  customElements.define(tagName, constructor);
  return constructor;
}

export function element(tagName: string, options?: ElementOptions) {
  if (options?.renderRoot !== undefined && options.renderRoot !== 'shadow' && options.renderRoot !== 'light') {
    throw new TypeError('snice: @element renderRoot must be "shadow" or "light".');
  }
  if (
    options?.shadow !== undefined && options.shadow !== false &&
    options.shadow !== 'open' && options.shadow !== 'closed'
  ) {
    throw new TypeError('snice: @element shadow must be "open", "closed", or false.');
  }
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
const nativeOwnPropertyDefaults = new WeakMap<Document, Map<PropertyKey, unknown>>();

function isNativeOwnPropertyDefault(instance: any, propertyKey: PropertyKey, value: unknown): boolean {
  const ownerDocument = instance?.ownerDocument as Document | undefined;
  if (!ownerDocument?.createElement) return false;
  let defaults = nativeOwnPropertyDefaults.get(ownerDocument);
  if (!defaults) {
    const nativeElement = ownerDocument.createElement('div') as any;
    defaults = new Map<PropertyKey, unknown>();
    for (const key of Reflect.ownKeys(nativeElement)) defaults.set(key, nativeElement[key]);
    nativeOwnPropertyDefaults.set(ownerDocument, defaults);
  }
  return defaults.has(propertyKey) && Object.is(defaults.get(propertyKey), value);
}

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


    return function(this: any, initialValue: any) {
      // A property binding can run while this is still an unupgraded custom
      // element, creating an own data property. Preserve that value across the
      // upgrade, but remove the expando before the decorated field initializer
      // is assigned so the assignment replays through the reactive accessor.
      const markedBindings = this[PRE_UPGRADE_PROPERTY_BINDINGS] as Set<string> | undefined;
      const wasTemplateBoundBeforeUpgrade = markedBindings?.delete(propertyKey) === true;
      if (markedBindings?.size === 0) delete this[PRE_UPGRADE_PROPERTY_BINDINGS];
      const hasOwnValue = Object.prototype.hasOwnProperty.call(this, propertyKey);
      const hadPreUpgradeValue = hasOwnValue && (
        wasTemplateBoundBeforeUpgrade || !isNativeOwnPropertyDefault(this, propertyKey, this[propertyKey])
      );
      const preUpgradeValue = hadPreUpgradeValue ? this[propertyKey] : initialValue;
      if (hasOwnValue) delete this[propertyKey];

      const constructor = this.constructor as any;
      if (!constructor[PROPERTIES]) constructor[PROPERTIES] = new Map();

      const finalOptions: PropertyOptions = { ...options };
      if (!finalOptions.type && initialValue !== undefined) finalOptions.type = detectType(initialValue);
      if (!finalOptions.attributeNaming && constructor.propertyAttributeNaming === 'kebab') {
        finalOptions.attributeNaming = 'kebab';
      }
      constructor[PROPERTIES].set(propertyKey, finalOptions);
      ensureObj(this, PROPERTY_DEFAULTS)[propertyKey] = initialValue;

      const notifyDeepMutation = () => {
        if (!this[PROPERTIES_INITIALIZED]) return;
        const current = this[PROPERTY_VALUES]?.[propertyKey];

        if (finalOptions.attribute !== false && finalOptions.reflect !== false) {
          const attributeName = getAttrName(finalOptions, propertyKey);
          const attributeValue = valueToAttribute(current, finalOptions, initialValue);
          const attrKey = attributeName.toLowerCase();
          ensureSet(this, SETTING_FROM_PROPERTY).add(attrKey);
          try {
            if (attributeValue === null) this.removeAttribute?.(attributeName);
            else this.setAttribute?.(attributeName, attributeValue);
          } finally {
            this[SETTING_FROM_PROPERTY].delete(attrKey);
          }
        }

        if (this[INITIALIZED]) {
          invokeWatchers(this, this.constructor, propertyKey, current, current);
          if (this[RENDER_METHOD]) requestRender(this);
        }
      };

      const wrap = (value: any) => {
        if (!finalOptions.deep) return value;
        let wrapped: any;
        wrapped = createDeepReactive(value, () => {
          // A caller may retain an old proxied object after replacing the
          // property. Mutating that detached graph must not invalidate the
          // component or notify watchers for the current value.
          if (this[PROPERTY_VALUES]?.[propertyKey] !== wrapped) return;
          notifyDeepMutation();
        });
        return wrapped;
      };
      ensureObj(this, PROPERTY_WRAPPERS)[propertyKey] = wrap;

      const proto = this.constructor.prototype;
      let definers: Map<string, any> | undefined = proto[PROPERTY_DEFINERS];
      if (!definers || !Object.prototype.hasOwnProperty.call(proto, PROPERTY_DEFINERS)) {
        definers = new Map(definers);
        proto[PROPERTY_DEFINERS] = definers;
      }
      const existingDefiner = definers.get(propertyKey);
      if (!existingDefiner || existingDefiner !== options) {
        definers.set(propertyKey, options);
        Object.defineProperty(this.constructor.prototype, propertyKey, {
          get(this: any) {
            if (this[PRE_INIT_PROPERTY_VALUES]?.has(propertyKey)) {
              return this[PRE_INIT_PROPERTY_VALUES].get(propertyKey);
            }
            if (this[PROPERTY_VALUES] && propertyKey in this[PROPERTY_VALUES]) {
              return this[PROPERTY_VALUES][propertyKey];
            }
            return initialValue;
          },
          set(this: any, incomingValue: any) {
            const oldValue = this[propertyKey];
            const changed = finalOptions.hasChanged
              ? finalOptions.hasChanged(incomingValue, oldValue)
              : notEqual(incomingValue, oldValue);
            if (!changed) return;

            const instanceWrap = this[PROPERTY_WRAPPERS]?.[propertyKey] || ((value: any) => value);
            // Property assignments are already typed JavaScript values and
            // remain the source of truth. `type` and `converter.fromAttribute`
            // apply only at the string attribute boundary; coercing here would
            // destroy object identity and turn valid union values (for example
            // `Date | ''` or `string | string[]`) into the wrong type.
            const newValue = instanceWrap(incomingValue);
            if (!this[PROPERTIES_INITIALIZED]) {
              if (!this[PRE_INIT_PROPERTY_VALUES]) this[PRE_INIT_PROPERTY_VALUES] = new Map();
              this[PRE_INIT_PROPERTY_VALUES].set(propertyKey, newValue);
              return;
            }

            ensureObj(this, PROPERTY_VALUES)[propertyKey] = newValue;

            if (finalOptions.attribute !== false && finalOptions.reflect !== false) {
              const attributeName = getAttrName(finalOptions, propertyKey);
              const attributeValue = valueToAttribute(
                newValue,
                finalOptions,
                this[PROPERTY_DEFAULTS]?.[propertyKey]
              );
              ensureSet(this, EXPLICITLY_SET_PROPERTIES).add(propertyKey);
              const attrKey = attributeName.toLowerCase();
              ensureSet(this, SETTING_FROM_PROPERTY).add(attrKey);
              try {
                if (attributeValue === null) this.removeAttribute?.(attributeName);
                else this.setAttribute?.(attributeName, attributeValue);
              } finally {
                this[SETTING_FROM_PROPERTY].delete(attrKey);
              }
            }

            if (this[INITIALIZED]) {
              invokeWatchers(this, this.constructor, propertyKey, oldValue, newValue);
              if (this[RENDER_METHOD]) requestRender(this);
            }
          },
          configurable: true,
          enumerable: true
        });
      }

      const wrappedInitialValue = wrap(initialValue);
      ensureObj(this, PROPERTY_VALUES)[propertyKey] = wrappedInitialValue;
      ensureObj(this, PROPERTY_DEFAULTS)[propertyKey] = wrappedInitialValue;
      return hadPreUpgradeValue ? preUpgradeValue : wrappedInitialValue;
    };
  };
}

/** Internal reactive state: never reads from or reflects to an attribute. */
export function state(options: StateOptions = {}) {
  return property({ ...options, attribute: false, reflect: false });
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
            const managedRoot = root instanceof HTMLElement ? getRenderRoot(root) : null;
            if (shadow && managedRoot) result = managedRoot.querySelector(selector);
            else if (shadow && root.shadowRoot) result = root.shadowRoot.querySelector(selector);
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
            const results = new Set<Element>();
            const managedRoot = root instanceof HTMLElement ? getRenderRoot(root) : null;
            if (shadow && managedRoot) {
              for (const match of managedRoot.querySelectorAll(selector)) results.add(match);
            } else if (shadow && root.shadowRoot) {
              for (const match of root.shadowRoot.querySelectorAll(selector)) results.add(match);
            }
            if (light) {
              for (const match of root.querySelectorAll(selector)) results.add(match);
            }
            return [...results] as any as NodeListOf<Element>;
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






export function watch(...args: (string | WatchOptions)[]) {
  // A trailing options object is separated from the watched property names.
  const propertyNames = args.filter((a): a is string => typeof a === 'string');
  const options = args.find((a): a is WatchOptions => typeof a === 'object' && a !== null);
  // Fire on init by default; opt out of the init call with { immediate: false }.
  const immediate = options?.immediate !== false;

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
          method: target,
          immediate
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

            const resolved = getAppContext(this);
            if (resolved === undefined) return undefined;

            // Explicit providers may be nested or released, so do not cache a
            // dynamically resolved value. Router-owned context is injected on
            // the instance and returned by the fast path above.
            return resolved;
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
