import { type RouteParams } from 'pica-route';
export interface RouteConfig {
    path: string;
    index: number;
    /** Lower values win when route specificity ties. Defaults to 0. */
    order?: number;
}
export interface MatchResult {
    index: number;
    params: RouteParams;
    path: string;
}
/**
 * Match a URL path against an array of route configs.
 * Uses pica-route — same matching as vanilla Snice's Router.
 * Routes are sorted by per-segment specificity (static > dynamic > wildcard),
 * then optional lower-first order, then declaration order.
 */
export declare function matchRoutes(routes: RouteConfig[], pathname: string): MatchResult | null;
