import { AppContext } from './app-context';
import { Placard } from './placard';
import { RouteParams } from './route-params';

/**
 * Navigation context bundled with placards and route information
 * Passed to layouts for rendering navigation
 */
export interface NavigationContext {
  /**
   * Application context
   */
  context: AppContext;

  /**
   * All registered placards
   */
  placards: Placard[];

  /**
   * Current route path
   */
  currentRoute: string;

  /**
   * Route parameters
   */
  routeParams: RouteParams;
}
