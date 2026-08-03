import { bindDaemon } from './daemon';
import { installContextProvider, getContext } from './context-provider';
import type { AppContext } from './types/app-context';

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
 * longer provided by any context.
 */
export function provideContext(root: EventTarget, context: AppContext): () => void {
  const releaseProvider = installContextProvider(root, context);
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

export { getContext };
