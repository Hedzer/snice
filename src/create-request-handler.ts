/**
 * createRequestHandler — vanilla JS utility for handling @request channels
 * outside of the Snice element/controller decorator system.
 *
 * Listens for @request CustomEvents on a target element (or document),
 * performs the discovery/data handshake, and dispatches to your route map.
 *
 * @example
 * ```js
 * import { createRequestHandler } from 'snice';
 *
 * const cleanup = createRequestHandler(document, {
 *   'fetch-user': async (payload) => {
 *     const res = await fetch(`/api/users/${payload.id}`);
 *     return res.json();
 *   },
 *   'save-settings': async (payload) => {
 *     await fetch('/api/settings', { method: 'POST', body: JSON.stringify(payload) });
 *     return { ok: true };
 *   }
 * });
 *
 * // Later, to remove all listeners:
 * cleanup();
 * ```
 */

export type RequestRoute = (payload: any) => any | Promise<any>;
export type RequestRouteMap = Record<string, RequestRoute>;

export interface CreateRequestHandlerOptions {
  /** If true, the handler will NOT stop propagation, allowing other handlers to also respond. Default: false */
  passive?: boolean;
}

/**
 * Attach request handlers to a DOM target.
 *
 * @param target  The element or document to listen on. Events bubble, so an
 *                ancestor element catches requests from any descendant.
 * @param routes  Map of channel names to handler functions.
 * @param options Optional configuration.
 * @returns A cleanup function that removes all listeners.
 */
export function createRequestHandler(
  target: EventTarget,
  routes: RequestRouteMap,
  options?: CreateRequestHandlerOptions,
): () => void {
  const cleanups: (() => void)[] = [];

  for (const [channelName, handler] of Object.entries(routes)) {
    const eventName = `@request/${channelName}`;

    const listener = (event: Event) => {
      const ce = event as CustomEvent;
      const { discovery, data, payload } = ce.detail;

      if (!options?.passive) {
        ce.preventDefault();
        ce.stopImmediatePropagation();
        ce.stopPropagation();
      }

      // Signal that we found the handler — clears discovery timeout
      discovery.resolve();

      // Execute the handler and wire up the data promise
      Promise.resolve()
        .then(() => handler(payload))
        .then((result: any) => data.resolve(result))
        .catch((error: any) => {
          data.reject(error);
          console.error(`createRequestHandler: error in "${channelName}" handler:`, error);
        });
    };

    target.addEventListener(eventName, listener);
    cleanups.push(() => target.removeEventListener(eventName, listener));
  }

  return () => {
    for (const fn of cleanups) fn();
    cleanups.length = 0;
  };
}
