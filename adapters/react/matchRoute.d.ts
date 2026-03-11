import { type RouteParams } from 'pica-route';
export interface RouteConfig {
    path: string;
    index: number;
}
export interface MatchResult {
    index: number;
    params: RouteParams;
    path: string;
}
/**
 * Match a URL path against an array of route configs.
 * Uses pica-route — same matching as vanilla Snice's Router.
 * Routes are sorted by specificity (longest spec first).
 */
export declare function matchRoutes(routes: RouteConfig[], pathname: string): MatchResult | null;
