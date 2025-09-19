import { Transition } from './Transition';

export type RouteParams = Record<string, string>;
export type Guard<T = any> = (context: T, params: RouteParams) => boolean | Promise<boolean>;

export interface PageOptions {
  /**
   * The tag name of the custom element.
   * @example { tag: 'login-page' }
   * // for <login-page></login-page>
   */
  tag: string;

  /**
   * The routes that will trigger the page element.
   * @example { routes: ['/login', '/login/:id'] }
   */
  routes: string[];

  /**
   * Optional per-page transition override
   */
  transition?: Transition;

  /**
   * Guard functions that must pass for navigation to proceed.
   * Can be a single guard or an array of guards (all must pass).
   */
  guards?: Guard<any> | Guard<any>[];

  /**
   * Layout element tag name for this page.
   * Use false to explicitly disable layout for this page.
   */
  layout?: string | false;
}