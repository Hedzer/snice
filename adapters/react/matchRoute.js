/*!
 * snice v4.31.0
 * A decorator-driven web component library with differential rendering, routing, controllers, and 130+ ready-made UI components. Use as much or as little as you want. Zero dependencies, works anywhere.
 * (c) 2024
 * Released under the MIT License.
 */
import { Route } from 'pica-route';

/**
 * Match a URL path against an array of route configs.
 * Uses pica-route — same matching as vanilla Snice's Router.
 * Routes are sorted by specificity (longest spec first).
 */
function matchRoutes(routes, pathname) {
    // Sort by specificity (longest path first), same as vanilla Router
    const sorted = [...routes].sort((a, b) => b.path.length - a.path.length);
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
