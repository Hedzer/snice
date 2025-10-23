import { Placard } from './placard';
import { RouteParams } from './route-params';

/**
 * Navigation context containing route state
 */
export interface NavContext {
  /**
   * All registered placards from pages
   */
  placards: Placard[];

  /**
   * Current route path
   */
  route: string;

  /**
   * Route parameters extracted from current route
   */
  params: RouteParams;
}
