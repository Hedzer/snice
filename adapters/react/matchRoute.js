/*!
 * snice v6.1.0
 * A decorator-driven web component library with differential rendering, routing, controllers, and 130+ ready-made UI components. Use as much or as little as you want. Zero dependencies, works anywhere.
 * (c) 2024
 * Released under the MIT License.
 *
 * GENERATED FILE — DO NOT EDIT. Source: src/. Rebuild: npm run build:core
 */
import { Route } from 'pica-route';

/**
 * Route specificity scorer for the React binding.
 *
 * IMPORTANT: keep this in exact sync with `src/route-specificity.ts`. The React
 * integration is bundled in isolation (rootDir: src/react) and cannot import
 * across that boundary, so the scorer is mirrored here. The `matchRoutes`
 * resolution tests exercise this copy, so behavioral drift is caught.
 *
 * Scoring is per-segment by ROLE, not string length: a static segment outweighs
 * a dynamic (`:param`) segment, which outweighs a wildcard (`*` / `*name`). So
 * `/post/new` beats `/post/:id`, and a splat always ranks last. Sort callers
 * descending by this score (highest = most specific = first).
 */
const STATIC_SEGMENT = 10;
const DYNAMIC_SEGMENT = 3;
const WILDCARD_SEGMENT = -2;
function routeSpecificity(spec) {
    const segments = spec.split('/').filter(Boolean);
    // Base on segment count so a deeper path outranks a shallower one on ties.
    let score = segments.length;
    for (const segment of segments) {
        if (segment.startsWith('*')) {
            score += WILDCARD_SEGMENT;
        }
        else if (segment.startsWith(':')) {
            score += DYNAMIC_SEGMENT;
        }
        else {
            score += STATIC_SEGMENT;
        }
    }
    return score;
}

/**
 * Match a URL path against an array of route configs.
 * Uses pica-route — same matching as vanilla Snice's Router.
 * Routes are sorted by per-segment specificity (static > dynamic > wildcard).
 */
function matchRoutes(routes, pathname) {
    // Sort by specificity (most specific first), same model as the vanilla Router.
    const sorted = [...routes].sort((a, b) => routeSpecificity(b.path) - routeSpecificity(a.path));
    for (const route of sorted) {
        const matcher = new Route(route.path);
        const params = matcher.match(pathname);
        if (params !== false) {
            return {
                index: route.index,
                params: params,
                path: route.path,
            };
        }
    }
    return null;
}

export { matchRoutes };
//# sourceMappingURL=matchRoute.js.map
