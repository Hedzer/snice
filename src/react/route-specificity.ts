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

export function routeSpecificity(spec: string): number {
  const segments = spec.split('/').filter(Boolean);
  // Base on segment count so a deeper path outranks a shallower one on ties.
  let score = segments.length;

  for (const segment of segments) {
    if (segment.startsWith('*')) {
      score += WILDCARD_SEGMENT;
    } else if (segment.startsWith(':')) {
      score += DYNAMIC_SEGMENT;
    } else {
      score += STATIC_SEGMENT;
    }
  }

  return score;
}
