import { Route, type RouteParams } from 'pica-route';
import { routeSpecificity } from './route-specificity';
import { matchRoute } from './route-match';

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
export function matchRoutes(routes: RouteConfig[], pathname: string): MatchResult | null {
  for (const route of routes) {
    if (route.order !== undefined && !Number.isFinite(route.order)) {
      throw new TypeError(`Route order for "${route.path}" must be a finite number.`);
    }
  }
  // Sort by specificity (most specific first), same model as the vanilla Router.
  const sorted = routes
    .map((route, registrationOrder) => ({ ...route, registrationOrder }))
    .sort((a, b) =>
      routeSpecificity(b.path) - routeSpecificity(a.path)
      || (a.order ?? 0) - (b.order ?? 0)
      || a.registrationOrder - b.registrationOrder
    );

  for (const route of sorted) {
    const matcher = new Route(route.path);
    const params = matchRoute(matcher, pathname);
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
