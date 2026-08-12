// v3.0.0 exports
export { element, layout, property, state, query, queryAll, watch, applyElementFunctionality, ready, dispose, reconnect, moved, adopted } from './element';
export type { Layout } from './element';
export { SniceElement } from './snice-element';
export { context as contextProperty } from './element'; // Deprecated: use @context method decorator instead
export { Router } from './router';
export { controller, useNativeElementControllers, attachController, detachController, getController } from './controller';
export { daemon } from './daemon';
export { provideContext, getContext, getContextFetch } from './app-context';
export type { ContextProviderOptions } from './app-context';
import { useNativeElementControllers } from './controller';

// Auto-enable native element controllers in browser environments
if (typeof document !== 'undefined') {
  useNativeElementControllers();
}
export { dispatch } from './events';
export { observe } from './observe';
export { on } from './on';
// Keep root event types explicit. NodeNext does not resolve the directory-star
// declaration export below as a source of named package exports.
export type { OnOptions } from './types/on-options';
export type { DispatchOptions } from './types/dispatch-options';
export type { EventTiming } from './types/event-timing';
export { request, respond } from './request-response';
export type { Response } from './request-response';
export { createRequestHandler } from './create-request-handler';
export type { RequestRoute, RequestRouteMap, CreateRequestHandlerOptions } from './create-request-handler';
export { IS_CONTROLLER_INSTANCE, getSymbol } from './symbols';

// v3.0.0 new template system
export { html, svg, css, nothing, unsafeHTML } from './template';
export type { TemplateResult, CSSResult, Nothing, UnsafeHTML } from './template';
export { render, styles, setStrictRenderErrors } from './render';
export { noChange, live } from './parts';
export type { NoChange } from './parts';
export { repeat } from './repeat';
export type { RepeatOptions, RepeatResult } from './repeat';
export type { RenderOptions } from './render';
export { classMap, styleMap } from './template-helpers';

// v3.0.0 custom element readiness utilities
export { waitForElementDefined, waitForElementReady, waitForAllCustomElements, setDisableElementReadyWarnings } from './element-ready';

// v3.0.0 render debugging utilities (for testing/debugging only)
export { trackRenders } from './render-debug';

// Shared utilities
export { parseDuration, escapeHtml, escapeAttr, isSafeUrl } from './utils';
export type { Duration } from './utils';
export { lockBodyScroll, unlockBodyScroll, getBodyScrollLockCount } from './scroll-lock';

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
