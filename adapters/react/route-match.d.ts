import type { Route, RouteParams } from 'pica-route';
/**
 * Match through pica-route while preserving legal empty query parameter values.
 * pica-route 1.1.2 rejects an empty param and therefore discards the whole route.
 * Keep this compatibility shim in sync with packages/core/src/route-match.ts.
 */
export declare function matchRoute(route: Route, url: string): RouteParams | false;
