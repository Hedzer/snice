// Central file for all symbols used in the framework
// All symbols are stored globally to ensure consistency across modules

import { getSymbol } from './global';

export { getSymbol };

export const IS_CONTROLLER_CLASS = /*#__PURE__*/ getSymbol('is-controller-class');
export const IS_CONTROLLER_INSTANCE = /*#__PURE__*/ getSymbol('is-controller-instance');
export const IS_DAEMON_CLASS = /*#__PURE__*/ getSymbol('is-daemon-class');
export const IS_DAEMON_INSTANCE = /*#__PURE__*/ getSymbol('is-daemon-instance');
export const IS_ELEMENT_CLASS = /*#__PURE__*/ getSymbol('is-element-class');
export const CHANNEL_HANDLERS = /*#__PURE__*/ getSymbol('channel-handlers');

// Per-instance daemon communication state. Daemon instances are constructed by
// application code; Snice only creates and manages their private EventTarget
// when an app context explicitly provides them.
export const DAEMON_STATE = /*#__PURE__*/ getSymbol('daemon-state');

// Internal element state symbols
export const READY_PROMISE = /*#__PURE__*/ getSymbol('ready-promise');
export const READY_RESOLVE = /*#__PURE__*/ getSymbol('ready-resolve');
export const READY_REJECT = /*#__PURE__*/ getSymbol('ready-reject');
// True only while an element is executing its own @ready handlers. A
// controller attached to that same host must not await the promise whose
// settlement depends on the current handler returning.
export const READY_HANDLERS_RUNNING = /*#__PURE__*/ getSymbol('ready-handlers-running');
export const RENDERED_PROMISE = /*#__PURE__*/ getSymbol('rendered-promise');
export const RENDERED_RESOLVE = /*#__PURE__*/ getSymbol('rendered-resolve');
// Set when a render is requested but dropped because the element was
// disconnected; consumed on reconnect to replay exactly the missed render.
export const PENDING_RECONNECT_RENDER = /*#__PURE__*/ getSymbol('pending-reconnect-render');
// Per-element synchronous render-nesting depth, used to cap runaway re-entry
// without a shared global counter that one element could exhaust for others.
export const RENDER_DEPTH = /*#__PURE__*/ getSymbol('render-depth');
export const RENDER_ROOT = /*#__PURE__*/ getSymbol('render-root');
export const ELEMENT_OPTIONS = /*#__PURE__*/ getSymbol('element-options');
export const CONTROLLER = /*#__PURE__*/ getSymbol('controller');
export const INITIALIZED = /*#__PURE__*/ getSymbol('initialized');

// Event handler symbols
export const ON_HANDLERS = /*#__PURE__*/ getSymbol('on-handlers');

// Controller symbols
export const CONTROLLER_KEY = /*#__PURE__*/ getSymbol('controller-key');
export const CONTROLLER_NAME_KEY = /*#__PURE__*/ getSymbol('controller-name');
export const CONTROLLER_ID = /*#__PURE__*/ getSymbol('controller-id');
export const CONTROLLER_OPERATIONS = /*#__PURE__*/ getSymbol('controller-operations');
export const NATIVE_CONTROLLER = /*#__PURE__*/ getSymbol('native-controller');
// Decorator name stored on the class so direct class bindings can expose the
// same useful DOM label without resolving the controller through the registry.
export const CONTROLLER_REGISTRY_NAME = /*#__PURE__*/ getSymbol('controller-registry-name');
// Set while a controller CLASS (not a registry name) is attached — the
// attribute/MutationObserver channel must not attach over or detach it.
export const DIRECT_CONTROLLER = /*#__PURE__*/ getSymbol('direct-controller');
// Guards framework-authored diagnostic controller attribute writes from the
// synchronous custom-element attributeChangedCallback path.
export const CONTROLLER_ATTRIBUTE_SYNC = /*#__PURE__*/ getSymbol('controller-attribute-sync');
// A controller class bound by a template before the custom element was
// defined/upgraded. Picked up by connectedCallback on first initialization.
export const PENDING_CONTROLLER_BINDING = /*#__PURE__*/ getSymbol('pending-controller-binding');

// Cleanup symbol - holds an object with all cleanup arrays
export const CLEANUP = /*#__PURE__*/ getSymbol('cleanup');

// Property symbols
export const PROPERTIES = /*#__PURE__*/ getSymbol('properties');
export const PROPERTY_VALUES = /*#__PURE__*/ getSymbol('property-values');
export const PROPERTY_DEFAULTS = /*#__PURE__*/ getSymbol('property-defaults');
export const PROPERTY_WRAPPERS = /*#__PURE__*/ getSymbol('property-wrappers');
export const PRE_INIT_PROPERTY_VALUES = /*#__PURE__*/ getSymbol('pre-init-property-values');
export const PRE_UPGRADE_PROPERTY_BINDINGS = /*#__PURE__*/ getSymbol('pre-upgrade-property-bindings');
export const PROPERTIES_INITIALIZED = /*#__PURE__*/ getSymbol('properties-initialized');
export const PROPERTY_WATCHERS = /*#__PURE__*/ getSymbol('property-watchers');
export const EXPLICITLY_SET_PROPERTIES = /*#__PURE__*/ getSymbol('explicitly-set-properties');

// Router context symbol
export const ROUTER_CONTEXT = /*#__PURE__*/ getSymbol('router-context');
export const CURRENT_PAGE_MARKER = /*#__PURE__*/ getSymbol('current-page-marker');
export const CONTEXT_REQUEST_HANDLER = /*#__PURE__*/ getSymbol('context-request-handler');
export const PAGE_TRANSITION = /*#__PURE__*/ getSymbol('page-transition');
export const CREATED_AT = /*#__PURE__*/ getSymbol('created-at');

// Lifecycle symbols
export const READY_HANDLERS = /*#__PURE__*/ getSymbol('ready-handlers');
export const DISPOSE_HANDLERS = /*#__PURE__*/ getSymbol('dispose-handlers');
export const RECONNECT_HANDLERS = /*#__PURE__*/ getSymbol('reconnect-handlers');
export const MOVED_HANDLERS = /*#__PURE__*/ getSymbol('moved-handlers');
export const ADOPTED_HANDLERS = /*#__PURE__*/ getSymbol('adopted-handlers');

// Observer symbols
export const OBSERVERS = /*#__PURE__*/ getSymbol('observers');

// Part symbols
export const PARTS = /*#__PURE__*/ getSymbol('parts');
export const PART_TIMERS = /*#__PURE__*/ getSymbol('part-timers');

// Property setter flag (prevents attributeChangedCallback re-triggering watchers)
export const SETTING_FROM_PROPERTY = /*#__PURE__*/ getSymbol('setting-from-property');

// Lifecycle callback timers
export const MOVED_TIMERS = /*#__PURE__*/ getSymbol('moved-timers');
export const ADOPTED_TIMERS = /*#__PURE__*/ getSymbol('adopted-timers');

// Dispatch timing symbols
export const DISPATCH_TIMERS = /*#__PURE__*/ getSymbol('dispatch-timers');

// Render symbols (v3.0.0)
export const RENDER_METHOD = /*#__PURE__*/ getSymbol('render-method');
export const RENDER_OPTIONS = /*#__PURE__*/ getSymbol('render-options');
export const RENDER_INSTANCE = /*#__PURE__*/ getSymbol('render-instance');
export const RENDER_TIMERS = /*#__PURE__*/ getSymbol('render-timers');
export const RENDER_CALLBACKS = /*#__PURE__*/ getSymbol('render-callbacks');
export const STYLES_METHOD = /*#__PURE__*/ getSymbol('styles-method');
export const STYLES_APPLIED = /*#__PURE__*/ getSymbol('styles-applied');
export const PARENT_STYLES_METHODS = /*#__PURE__*/ getSymbol('parent-styles-methods');
export const SNICE_ELEMENT_BASE: unique symbol = /*#__PURE__*/ getSymbol('snice-element-base') as any;

// Navigation context symbols
export const CONTEXT_HANDLER = /*#__PURE__*/ getSymbol('context-handler');
export const CONTEXT_METHOD_NAME = /*#__PURE__*/ getSymbol('context-method-name');
export const NAVIGATION_CONTEXT_INSTANCE = /*#__PURE__*/ getSymbol('navigation-context-instance');
export const REGISTERED_ELEMENTS = /*#__PURE__*/ getSymbol('registered-elements');
export const IS_UPDATING = /*#__PURE__*/ getSymbol('is-updating');
export const CONTEXT_REGISTER = /*#__PURE__*/ getSymbol('context-register');
export const CONTEXT_UNREGISTER = /*#__PURE__*/ getSymbol('context-unregister');
export const CONTEXT_NOTIFY_ELEMENT = /*#__PURE__*/ getSymbol('context-notify-element');
export const CONTEXT_OPTIONS = /*#__PURE__*/ getSymbol('context-options');
export const CONTEXT_TIMER = /*#__PURE__*/ getSymbol('context-timer');
export const CONTEXT_CALLED = /*#__PURE__*/ getSymbol('context-called');
export const CONTEXT_UPDATE = /*#__PURE__*/ getSymbol('context-update');

// Registration de-dup sets on the constructor — replace previous `__*Methods`
// expando strings that violated the no-double-underscore rule.
export const CONTEXT_METHODS = /*#__PURE__*/ getSymbol('context-methods');
export const WATCH_METHODS = /*#__PURE__*/ getSymbol('watch-methods');
export const OBSERVE_METHODS = /*#__PURE__*/ getSymbol('observe-methods');
export const ON_METHODS = /*#__PURE__*/ getSymbol('on-methods');
export const RESPOND_METHODS = /*#__PURE__*/ getSymbol('respond-methods');
export const READY_METHODS = /*#__PURE__*/ getSymbol('ready-methods');
export const DISPOSE_METHODS = /*#__PURE__*/ getSymbol('dispose-methods');
export const RECONNECT_METHODS = /*#__PURE__*/ getSymbol('reconnect-methods');
export const MOVED_METHODS = /*#__PURE__*/ getSymbol('moved-methods');
export const ADOPTED_METHODS = /*#__PURE__*/ getSymbol('adopted-methods');

// Controller attach-abort — set to an AbortController while attachController
// is awaiting element.ready, so detachController can short-circuit the wait.
export const CONTROLLER_ABORT = /*#__PURE__*/ getSymbol('controller-abort');
// Set on a controller instance once it has gotten past element.ready and is
// being attached, so detachController knows not to run detach() on a controller
// whose attach() was aborted before it ever ran.
export const CONTROLLER_ATTACHED = /*#__PURE__*/ getSymbol('controller-attached');
export const PROPERTY_DEFINERS = /*#__PURE__*/ getSymbol('property-definers');
