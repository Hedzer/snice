import { RouteParams } from './route-params';

/**
 * Guard function type for route protection and visibility control.
 * Guards determine if navigation to a route should proceed or if a page should be visible.
 *
 * @template T - The context type passed to the guard function
 * @param context - The application context object
 * @param params - Route parameters extracted from the URL
 * @returns boolean or Promise<boolean> - true to allow access, false to deny
 *
 * @example
 * ```typescript
 * const isAuthenticated: Guard<AppContext> = (ctx, params) => ctx.getUser() !== null;
 * const canEditUser: Guard<AppContext> = async (ctx, params) => {
 *   const response = await fetch(`/api/permissions/users/${params.id}/can-edit`);
 *   return response.ok;
 * };
 * ```
 */
export type Guard<T = any> = (context: T, params: RouteParams) => boolean | Promise<boolean>;