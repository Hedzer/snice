/*!
 * snice v4.33.0
 * A decorator-driven web component library with differential rendering, routing, controllers, and 130+ ready-made UI components. Use as much or as little as you want. Zero dependencies, works anywhere.
 * (c) 2024
 * Released under the MIT License.
 */
import { useRef, useEffect } from 'react';

/**
 * useRequestHandler — React hook for handling @request channels
 * outside of the Snice element/controller decorator system.
 *
 * Listens for @request CustomEvents on a ref'd element (or document),
 * performs the discovery/data handshake, and dispatches to your route map.
 *
 * The route map is **not** required to be stable across renders — the hook
 * always uses the latest callbacks without re-attaching listeners.
 *
 * @example
 * ```tsx
 * import { useRequestHandler } from 'snice/react/useRequestHandler';
 *
 * function App() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   useRequestHandler(containerRef, {
 *     'fetch-user': async (payload) => {
 *       const res = await fetch(`/api/users/${payload.id}`);
 *       return res.json();
 *     },
 *   });
 *
 *   return (
 *     <div ref={containerRef}>
 *       <snice-user-card />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Global handler (no ref — listens on document)
 * useRequestHandler(null, {
 *   'fetch-user': async (payload) => ({ name: 'Jane', id: payload.id }),
 * });
 * ```
 */
/**
 * React hook that attaches request handlers for @request channels.
 *
 * @param ref   React ref to the target element, or null to use document.
 * @param routes  Map of channel names to handler functions.
 * @param options Optional configuration.
 */
function useRequestHandler(ref, routes, options) {
    const routesRef = useRef(routes);
    routesRef.current = routes;
    const optionsRef = useRef(options);
    optionsRef.current = options;
    const channelKeys = Object.keys(routes).sort().join('\0');
    useEffect(() => {
        const target = ref?.current ?? document;
        const cleanups = [];
        for (const channelName of channelKeys.split('\0')) {
            if (!channelName)
                continue;
            const eventName = `@request/${channelName}`;
            const listener = (event) => {
                const ce = event;
                const { discovery, data, payload } = ce.detail;
                if (!optionsRef.current?.passive) {
                    ce.preventDefault();
                    ce.stopImmediatePropagation();
                    ce.stopPropagation();
                }
                discovery.resolve();
                const handler = routesRef.current[channelName];
                if (!handler) {
                    data.reject(new Error(`useRequestHandler: no handler for "${channelName}"`));
                    return;
                }
                Promise.resolve()
                    .then(() => handler(payload))
                    .then((result) => data.resolve(result))
                    .catch((error) => {
                    data.reject(error);
                    console.error(`useRequestHandler: error in "${channelName}" handler:`, error);
                });
            };
            target.addEventListener(eventName, listener);
            cleanups.push(() => target.removeEventListener(eventName, listener));
        }
        return () => {
            for (const fn of cleanups)
                fn();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelKeys, ref]);
}

export { useRequestHandler };
//# sourceMappingURL=useRequestHandler.js.map
