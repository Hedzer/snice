import type { Route, RouteParams } from 'pica-route';

const EMPTY_QUERY_MARKER = '__snice_empty_query_value__';
const QUERY_PARAM_PATTERN = /=:[\w-]+\)?$/;

function containsDecodedMarker(url: string, marker: string): boolean {
  if (url.includes(marker)) return true;

  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return false;

  return url.slice(queryIndex + 1).split('&').some(part => {
    try {
      return decodeURIComponent(part).includes(marker);
    } catch {
      return false;
    }
  });
}

function emptyQueryMarker(route: Route, url: string): string {
  let marker = EMPTY_QUERY_MARKER;
  while (route.spec.includes(marker) || containsDecodedMarker(url, marker)) {
    marker += '_';
  }
  return marker;
}

function fillEmptyQueryParams(route: Route, url: string, marker: string): string | null {
  const urlQueryIndex = url.indexOf('?');
  const routeQueryIndex = route.spec.indexOf('?');
  if (urlQueryIndex === -1 || routeQueryIndex === -1) return null;

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

  if (!changed) return null;
  return `${url.slice(0, urlQueryIndex + 1)}${normalizedParts.join('&')}`;
}

/**
 * Match through pica-route while preserving legal empty query parameter values.
 * pica-route 1.1.2 rejects an empty param and therefore discards the whole route.
 * Keep this compatibility shim in sync with packages/react/src/route-match.ts.
 */
export function matchRoute(route: Route, url: string): RouteParams | false {
  const directMatch = route.match(url);
  if (directMatch !== false) return directMatch;

  const marker = emptyQueryMarker(route, url);
  const normalizedUrl = fillEmptyQueryParams(route, url, marker);
  if (normalizedUrl === null) return false;

  const params = route.match(normalizedUrl);
  if (params === false) return false;

  for (const name of Object.keys(params)) {
    if (params[name] === marker) params[name] = '';
  }
  return params;
}
