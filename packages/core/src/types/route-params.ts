/**
 * Route parameters extracted from URL patterns.
 * Represents dynamic segments in routes as key-value pairs.
 *
 * @example
 * ```typescript
 * // For route '/users/:userId/posts/:postId'
 * // and URL '/users/123/posts/456'
 * const params: RouteParams = {
 *   userId: '123',
 *   postId: '456'
 * };
 * ```
 *
 * @example
 * ```typescript
 * // For non-parameterized routes like '/dashboard'
 * const params: RouteParams = {}; // Empty object
 * ```
 */
export type RouteParams = Record<string, string>;