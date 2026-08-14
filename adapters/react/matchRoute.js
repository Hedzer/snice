/*!
 * snice v7.6.0
 * A decorator-driven web component library with routing, controllers, daemons, and 130+ UI components. For better coding-agent results, run npx snice init-ai.
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

const EMPTY_QUERY_MARKER = '__snice_empty_query_value__';
const QUERY_PARAM_PATTERN = /=:[\w-]+\)?$/;
function containsDecodedMarker(url, marker) {
    if (url.includes(marker))
        return true;
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1)
        return false;
    return url.slice(queryIndex + 1).split('&').some(part => {
        try {
            return decodeURIComponent(part).includes(marker);
        }
        catch {
            return false;
        }
    });
}
function emptyQueryMarker(route, url) {
    let marker = EMPTY_QUERY_MARKER;
    while (route.spec.includes(marker) || containsDecodedMarker(url, marker)) {
        marker += '_';
    }
    return marker;
}
function fillEmptyQueryParams(route, url, marker) {
    const urlQueryIndex = url.indexOf('?');
    const routeQueryIndex = route.spec.indexOf('?');
    if (urlQueryIndex === -1 || routeQueryIndex === -1)
        return null;
    const urlParts = url.slice(urlQueryIndex + 1).split('&');
    const routeParts = route.spec.slice(routeQueryIndex + 1).split('&');
    let changed = false;
    const normalizedParts = urlParts.map((part, index) => {
        if (part.endsWith('=') && QUERY_PARAM_PATTERN.test(routeParts[index] ?? '')) {
            changed = true;
            return `${part}${marker}`;
        }
        return part;
    });
    if (!changed)
        return null;
    return `${url.slice(0, urlQueryIndex + 1)}${normalizedParts.join('&')}`;
}
/**
 * Match through pica-route while preserving legal empty query parameter values.
 * pica-route 1.1.2 rejects an empty param and therefore discards the whole route.
 * Keep this compatibility shim in sync with packages/core/src/route-match.ts.
 */
function matchRoute(route, url) {
    const directMatch = route.match(url);
    if (directMatch !== false)
        return directMatch;
    const marker = emptyQueryMarker(route, url);
    const normalizedUrl = fillEmptyQueryParams(route, url, marker);
    if (normalizedUrl === null)
        return false;
    const params = route.match(normalizedUrl);
    if (params === false)
        return false;
    for (const name of Object.keys(params)) {
        if (params[name] === marker)
            params[name] = '';
    }
    return params;
}

/**
 * Match a URL path against an array of route configs.
 * Uses pica-route — same matching as vanilla Snice's Router.
 * Routes are sorted by per-segment specificity (static > dynamic > wildcard),
 * then optional lower-first order, then declaration order.
 */
function matchRoutes(routes, pathname) {
    for (const route of routes) {
        if (route.order !== undefined && !Number.isFinite(route.order)) {
            throw new TypeError(`Route order for "${route.path}" must be a finite number.`);
        }
    }
    // Sort by specificity (most specific first), same model as the vanilla Router.
    const sorted = routes
        .map((route, registrationOrder) => ({ ...route, registrationOrder }))
        .sort((a, b) => routeSpecificity(b.path) - routeSpecificity(a.path)
        || (a.order ?? 0) - (b.order ?? 0)
        || a.registrationOrder - b.registrationOrder);
    for (const route of sorted) {
        const matcher = new Route(route.path);
        const params = matchRoute(matcher, pathname);
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
