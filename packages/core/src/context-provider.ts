import { IS_CONTROLLER_INSTANCE, ROUTER_CONTEXT } from './symbols';
import type { AppContext } from './types/app-context';
import type { Context } from './types/context';

const CONTEXT_REQUEST_EVENT = '@context/request';

interface ContextRequestDetail {
  kind: 'application' | 'fetch' | 'navigation';
  context?: AppContext;
  fetch?: typeof globalThis.fetch;
  navigation?: Context;
}

interface ProviderRecord {
  listener: EventListener;
}

const providers = new WeakMap<EventTarget, ProviderRecord>();

/** @internal */
export function hasContextProvider(root: EventTarget): boolean {
  return providers.has(root);
}

function contextTarget(source: unknown): EventTarget | null {
  if (!source || (typeof source !== 'object' && typeof source !== 'function')) {
    return null;
  }

  const value = source as any;
  if (value[IS_CONTROLLER_INSTANCE] === true) {
    return value.element && typeof value.element.dispatchEvent === 'function'
      ? value.element
      : null;
  }

  return typeof value.dispatchEvent === 'function' ? value as EventTarget : null;
}

/**
 * Installs the low-level application-context provider on a concrete event
 * boundary. Public callers use provideContext(), which also activates the
 * daemon instances declared by the context.
 */
export function installContextProvider(
  root: EventTarget,
  context: AppContext,
  fetch?: typeof globalThis.fetch,
  navigation?: Context
): () => void {
  if (!root || typeof root.addEventListener !== 'function' || typeof root.removeEventListener !== 'function') {
    throw new TypeError('provideContext() requires an EventTarget root.');
  }
  if (!context || typeof context !== 'object') {
    throw new TypeError('provideContext() requires an application context object.');
  }
  if (providers.has(root)) {
    throw new Error('This root already provides an application context. Release it before providing another.');
  }

  const listener: EventListener = (event) => {
    const request = event as CustomEvent<ContextRequestDetail>;
    if (!request.detail) return;
    if (request.detail.kind === 'application') {
      if (request.detail.context !== undefined) return;
      request.detail.context = context;
    } else if (request.detail.kind === 'fetch') {
      if (!fetch || request.detail.fetch !== undefined) return;
      request.detail.fetch = fetch;
    } else if (request.detail.kind === 'navigation') {
      if (!navigation || request.detail.navigation !== undefined) return;
      request.detail.navigation = navigation;
    } else {
      return;
    }
    request.preventDefault();
    request.stopPropagation();
  };

  root.addEventListener(CONTEXT_REQUEST_EVENT, listener);
  providers.set(root, { listener });

  let released = false;
  return () => {
    if (released) return;
    released = true;

    const current = providers.get(root);
    if (current?.listener === listener) {
      root.removeEventListener(CONTEXT_REQUEST_EVENT, listener);
      providers.delete(root);
    }
  };
}

/**
 * Resolves the raw application context visible to an element or controller.
 * A single composed, bubbling request is answered by the nearest
 * provideContext() root. Router-injected context remains a fallback for a
 * detached page or controller that cannot currently reach its provider.
 */
export function getContext<T extends AppContext = AppContext>(source: unknown): T | undefined {
  if (!source || (typeof source !== 'object' && typeof source !== 'function')) {
    return undefined;
  }

  const target = contextTarget(source);
  if (target) {
    const detail: ContextRequestDetail = { kind: 'application' };
    target.dispatchEvent(new CustomEvent<ContextRequestDetail>(CONTEXT_REQUEST_EVENT, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    }));
    if (detail.context !== undefined) return detail.context as T;
  }

  const value = source as any;
  if (value[ROUTER_CONTEXT] !== undefined) {
    return value[ROUTER_CONTEXT] as T;
  }
  if (value[IS_CONTROLLER_INSTANCE] === true && value.element?.[ROUTER_CONTEXT] !== undefined) {
    return value.element[ROUTER_CONTEXT] as T;
  }
  return undefined;
}

/**
 * Resolve the fetch function supplied by the nearest context provider.
 * Router providers expose their ContextAwareFetcher-bound function here;
 * explicit providers may supply the same dependency for non-router apps and
 * tests without adding a reserved property to AppContext.
 */
export function getContextFetch(source: unknown): typeof globalThis.fetch | undefined {
  const target = contextTarget(source);
  if (!target) return undefined;

  const detail: ContextRequestDetail = { kind: 'fetch' };
  target.dispatchEvent(new CustomEvent<ContextRequestDetail>(CONTEXT_REQUEST_EVENT, {
    bubbles: true,
    composed: true,
    cancelable: true,
    detail,
  }));
  return detail.fetch;
}

/** @internal Resolve the router Context visible to an element or controller. */
export function getNavigationContext(source: unknown): Context | undefined {
  const target = contextTarget(source);
  if (!target) return undefined;

  const detail: ContextRequestDetail = { kind: 'navigation' };
  target.dispatchEvent(new CustomEvent<ContextRequestDetail>(CONTEXT_REQUEST_EVENT, {
    bubbles: true,
    composed: true,
    cancelable: true,
    detail,
  }));
  return detail.navigation;
}
