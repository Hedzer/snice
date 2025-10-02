import { Transition } from './transition';
import { Placard } from './placard';
import { Guard } from './guard';
import { AppContext } from './app-context';

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
  guards?: Guard<AppContext> | Guard<AppContext>[];

  /**
   * Layout element tag name for this page.
   * Use false to explicitly disable layout for this page.
   */
  layout?: string | false;

  /**
   * Page metadata that layouts can consume for navigation,
   * breadcrumbs, help information, and other UI elements.
   * Can be a static placard object or a function that returns one.
   * @example placard: { name: 'dashboard', title: 'Dashboard' }
   * @example placard: (ctx) => ({ name: 'user-edit', title: `Edit ${ctx.getCurrentUser().name}` })
   */
  placard?: Placard | ((context: AppContext) => Placard);
}