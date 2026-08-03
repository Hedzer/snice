import { Transition } from './transition';
import { Placard } from './placard';
import { Guard } from './guard';
import { AppContext } from './app-context';

export interface PageRouteOptions {
  /** Route pattern matched by the router. */
  path: string;

  /**
   * Optional priority used only when route specificity ties.
   * Lower numbers match first. Equal or omitted values preserve registration
   * order, including the order of entries in PageOptions.routes.
   */
  order?: number;
}

export interface PageOptions {
  /**
   * The tag name of the custom element.
   * @example { tag: 'login-page' }
   * // for <login-page></login-page>
   */
  tag: string;

  /**
   * The routes that will trigger the page element.
   * String entries are the normal form. Their array order breaks specificity
   * ties. Use an object entry only when an explicit order is needed across
   * registrations.
   * @example { routes: ['/login', '/login/:id'] }
   * @example { routes: [{ path: '/login', order: 10 }] }
   */
  routes: Array<string | PageRouteOptions>;

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
