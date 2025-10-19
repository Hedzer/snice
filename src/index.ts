// v3.0.0 exports
export { element, layout, property, query, queryAll, watch, context, applyElementFunctionality, ready, dispose, moved, adopted } from './element';
export type { Layout } from './element';
export { Router } from './router';
export { controller, useNativeElementControllers } from './controller';
export { dispatch } from './events';
export { observe } from './observe';
export { on } from './on';
export type { OnOptions } from './on';
export { request, respond } from './request-response';
export { IS_CONTROLLER_INSTANCE, getSymbol } from './symbols';

// v3.0.0 new template system
export { html, css, nothing } from './template';
export type { TemplateResult, CSSResult, Nothing } from './template';
export { render, styles } from './render';
export type { RenderOptions } from './render';

// v3.0.0 custom element readiness utilities
export { waitForElementDefined, waitForElementReady, waitForAllCustomElements, setDisableElementReadyWarnings } from './element-ready';

// v3.0.0 method decorators
export { debounce, throttle, once, memoize, clearDebounceTimers, clearThrottleTimers, clearMemoizeCache, resetOnce } from './method-decorators';

// Export all types from centralized types module
export * from './types';

// @on decorator removed in v3.0.0 - use template event syntax instead
// @part decorator removed in v3.0.0 - use @render with differential rendering