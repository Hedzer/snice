import { Route, type RouteParams } from 'pica-route';

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
export function matchRoutes(routes: RouteConfig[], pathname: string): MatchResult | null {
  // Sort by specificity (longest path first), same as vanilla Router
  const sorted = [...routes].sort((a, b) => b.path.length - a.path.length);

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
