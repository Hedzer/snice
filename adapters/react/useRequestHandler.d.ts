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
export type UseRequestRoute = (payload: any) => any | Promise<any>;
export type UseRequestRouteMap = Record<string, UseRequestRoute>;
export interface UseRequestHandlerOptions {
    /** If true, the handler will NOT stop propagation. Default: false */
    passive?: boolean;
}
/**
 * React hook that attaches request handlers for @request channels.
 *
 * @param ref   React ref to the target element, or null to use document.
 * @param routes  Map of channel names to handler functions.
 * @param options Optional configuration.
 */
export declare function useRequestHandler(ref: {
    current: EventTarget | null;
} | null, routes: UseRequestRouteMap, options?: UseRequestHandlerOptions): void;
