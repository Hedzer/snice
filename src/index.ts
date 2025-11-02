// v3.0.0 exports
export { element, layout, property, query, queryAll, watch, applyElementFunctionality, ready, dispose, moved, adopted } from './element';
export type { Layout } from './element';
export { context as contextProperty } from './element'; // Deprecated: use @context method decorator instead
export { Router } from './router';
export { controller, useNativeElementControllers } from './controller';
export { dispatch } from './events';
export { observe } from './observe';
export { on } from './on';
export type { OnOptions } from './on';
export { request, respond } from './request-response';
export { IS_CONTROLLER_INSTANCE, getSymbol } from './symbols';

// v3.0.0 new template system
export { html, css, nothing, unsafeHTML } from './template';
export type { TemplateResult, CSSResult, Nothing, UnsafeHTML } from './template';
export { render, styles } from './render';
export type { RenderOptions } from './render';

// v3.0.0 custom element readiness utilities
export { waitForElementDefined, waitForElementReady, waitForAllCustomElements, setDisableElementReadyWarnings } from './element-ready';

// v3.0.0 render debugging utilities (for testing/debugging only)
export { trackRenders } from './render-debug';

// v3.0.0 method decorators
export { debounce, throttle, once, memoize, clearDebounceTimers, clearThrottleTimers, clearMemoizeCache, resetOnce } from './method-decorators';

// Router context decorator (method decorator for receiving router updates)
export { context } from './context';
export type { ContextOptions } from './context';

// Fetch middleware system
export { ContextAwareFetcher } from './fetcher';
export type { Fetcher, RequestMiddleware, ResponseMiddleware } from './fetcher';

// Export all types from centralized types module
export * from './types';

// NOTE: @on decorator works in both elements AND controllers.
// Supports event delegation, keyboard modifiers, debounce/throttle - see docs/events.md
// Template event syntax (@click=${handler}) is also available as an alternative.