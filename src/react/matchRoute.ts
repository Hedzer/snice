import { Route, type RouteParams } from 'pica-route';
import { routeSpecificity } from './route-specificity';

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
 * Routes are sorted by per-segment specificity (static > dynamic > wildcard).
 */
export function matchRoutes(routes: RouteConfig[], pathname: string): MatchResult | null {
  // Sort by specificity (most specific first), same model as the vanilla Router.
  const sorted = [...routes].sort((a, b) => routeSpecificity(b.path) - routeSpecificity(a.path));

  for (const route of sorted) {
    const matcher = new Route(route.path);
    const params = matcher.match(pathname);
    if (params !== false) {
      return {
        index: route.index,
        params: params as RouteParams,
        path: route.path,
      };
    }
  }

  return null;
}
