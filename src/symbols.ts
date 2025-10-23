// Central file for all symbols used in the framework
// All symbols are stored globally to ensure consistency across modules

import { getSymbol } from './global';

export { getSymbol };

export const IS_CONTROLLER_CLASS = getSymbol('is-controller-class');
export const IS_CONTROLLER_INSTANCE = getSymbol('is-controller-instance');
export const IS_ELEMENT_CLASS = getSymbol('is-element-class');
export const CHANNEL_HANDLERS = getSymbol('channel-handlers');

// Internal element state symbols
export const READY_PROMISE = getSymbol('ready-promise');
export const READY_RESOLVE = getSymbol('ready-resolve');
export const RENDERED_PROMISE = getSymbol('rendered-promise');
export const RENDERED_RESOLVE = getSymbol('rendered-resolve');
export const CONTROLLER = getSymbol('controller');
export const INITIALIZED = getSymbol('initialized');

// Event handler symbols
export const ON_HANDLERS = getSymbol('on-handlers');

// Controller symbols
export const CONTROLLER_KEY = getSymbol('controller-key');
export const CONTROLLER_NAME_KEY = getSymbol('controller-name');
export const CONTROLLER_ID = getSymbol('controller-id');
export const CONTROLLER_OPERATIONS = getSymbol('controller-operations');
export const NATIVE_CONTROLLER = getSymbol('native-controller');

// Cleanup symbol - holds an object with all cleanup arrays
export const CLEANUP = getSymbol('cleanup');

// Property symbols
export const PROPERTIES = getSymbol('properties');
export const PROPERTY_VALUES = getSymbol('property-values');
export const PRE_INIT_PROPERTY_VALUES = getSymbol('pre-init-property-values');
export const PROPERTIES_INITIALIZED = getSymbol('properties-initialized');
export const PROPERTY_WATCHERS = getSymbol('property-watchers');
export const EXPLICITLY_SET_PROPERTIES = getSymbol('explicitly-set-properties');

// Router context symbol
export const ROUTER_CONTEXT = getSymbol('router-context');
export const CURRENT_PAGE_MARKER = getSymbol('current-page-marker');
export const CONTEXT_REQUEST_HANDLER = getSymbol('context-request-handler');
export const PAGE_TRANSITION = getSymbol('page-transition');
export const CREATED_AT = getSymbol('created-at');

// Lifecycle symbols
export const READY_HANDLERS = getSymbol('ready-handlers');
export const DISPOSE_HANDLERS = getSymbol('dispose-handlers');
export const MOVED_HANDLERS = getSymbol('moved-handlers');
export const ADOPTED_HANDLERS = getSymbol('adopted-handlers');

// Observer symbols
export const OBSERVERS = getSymbol('observers');

// Part symbols
export const PARTS = getSymbol('parts');
export const PART_TIMERS = getSymbol('part-timers');

// Lifecycle callback timers
export const MOVED_TIMERS = getSymbol('moved-timers');
export const ADOPTED_TIMERS = getSymbol('adopted-timers');

// Dispatch timing symbols
export const DISPATCH_TIMERS = getSymbol('dispatch-timers');

// Render symbols (v3.0.0)
export const RENDER_METHOD = getSymbol('render-method');
export const RENDER_OPTIONS = getSymbol('render-options');
export const RENDER_INSTANCE = getSymbol('render-instance');
export const RENDER_SCHEDULED = getSymbol('render-scheduled');
export const RENDER_TIMERS = getSymbol('render-timers');
export const RENDER_CALLBACKS = getSymbol('render-callbacks');
export const STYLES_METHOD = getSymbol('styles-method');
export const STYLES_APPLIED = getSymbol('styles-applied');

// Navigation context symbols
export const CONTEXT_HANDLER = getSymbol('context-handler');
export const CONTEXT_METHOD_NAME = getSymbol('context-method-name');
export const NAVIGATION_CONTEXT_INSTANCE = getSymbol('navigation-context-instance');
export const REGISTERED_ELEMENTS = getSymbol('registered-elements');
export const IS_UPDATING = getSymbol('is-updating');
export const CONTEXT_REGISTER = getSymbol('context-register');
export const CONTEXT_UNREGISTER = getSymbol('context-unregister');
export const CONTEXT_NOTIFY_ELEMENT = getSymbol('context-notify-element');
export const CONTEXT_OPTIONS = getSymbol('context-options');
export const CONTEXT_TIMER = getSymbol('context-timer');
export const CONTEXT_CALLED = getSymbol('context-called');