import { RouteParams } from './route-params';

/**
 * Guard function type for route protection and visibility control.
 * Guards determine if navigation to a route should proceed.
 * Can return a boolean synchronously or a Promise<boolean> for async checks.
 *
 * @template T - The context type passed to the guard function
 * @param context - The application context object
 * @param params - Route parameters extracted from the URL
 * @returns boolean or Promise<boolean> - true to allow, false to deny
 */
export type Guard<T = any> = (context: T, params: RouteParams) => boolean | Promise<boolean>;