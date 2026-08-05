import { bindDaemon } from './daemon';
import { installContextProvider, getContext, getContextFetch } from './context-provider';
import type { AppContext } from './types/app-context';
import type { Context } from './types/context';

export interface ContextProviderOptions {
  /** Fetch function exposed to descendants through getContextFetch(). */
  fetch?: typeof globalThis.fetch;
}

function bindContextDaemons(context: AppContext): () => void {
  const daemonMap = context.daemons;
  if (daemonMap === undefined) return () => {};
  if (!daemonMap || typeof daemonMap !== 'object' || Array.isArray(daemonMap)) {
    throw new TypeError('AppContext.daemons must be a readonly record of named @daemon instances.');
  }

  const releases: Array<() => void> = [];
  const bound = new Set<object>();
  try {
    for (const [name, instance] of Object.entries(daemonMap)) {
      if (!name.trim()) {
        throw new TypeError('AppContext.daemons keys must be non-empty strings.');
      }
      if (!instance || typeof instance !== 'object') {
        throw new TypeError(`AppContext.daemons["${name}"] must be an instance of an @daemon class.`);
      }
      if (bound.has(instance)) continue;
      bound.add(instance);
      releases.push(bindDaemon(instance));
    }
  } catch (error) {
    for (const release of releases.reverse()) release();
    throw error;
  }

  return () => {
    for (const release of releases.reverse()) release();
  };
}

/**
 * Makes one explicit application context visible beneath a root.
 *
 * Daemon instances must already exist in context.daemons. The returned cleanup
 * removes the provider and deactivates framework communication for daemons no
 * longer provided by any context. An optional fetch function is exposed on the
 * same boundary through getContextFetch() without modifying the context object.
 */
function provideContextBoundary(
  root: EventTarget,
  context: AppContext,
  options: ContextProviderOptions,
  navigation?: Context
): () => void {
  const releaseProvider = installContextProvider(root, context, options.fetch, navigation);
  let releaseDaemons: (() => void) | undefined;
  try {
    releaseDaemons = bindContextDaemons(context);
  } catch (error) {
    releaseProvider();
    throw error;
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseProvider();
    releaseDaemons?.();
  };
}

export function provideContext(
  root: EventTarget,
  context: AppContext,
  options: ContextProviderOptions = {}
): () => void {
  return provideContextBoundary(root, context, options);
}

/** @internal Router-owned provider including live navigation state. */
export function provideRouterContext(root: EventTarget, navigation: Context): () => void {
  return provideContextBoundary(root, navigation.application, {
    fetch: navigation.fetch,
  }, navigation);
}

export { getContext, getContextFetch };
