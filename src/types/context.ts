import { AppContext } from './app-context';
import { NavContext } from './nav-context';
import { Placard } from './placard';
import { RouteParams } from './route-params';
import { REGISTERED_ELEMENTS, IS_UPDATING, CONTEXT_REGISTER, CONTEXT_UNREGISTER, CONTEXT_NOTIFY_ELEMENT, CONTEXT_UPDATE } from '../symbols';
import type { Fetcher } from '../fetcher';

// Symbol for storing the Set of elements
// Use Symbol.for() to ensure symbols are shared across multiple Snice instances
const REGISTERED_ELEMENTS_SET = Symbol.for('snice:registered-elements-set');

// Counter for generating unique context IDs
let contextIdCounter = 0;

/**
 * Represents the bundled router state that can notify registered elements of changes
 */
export class Context {
  private [REGISTERED_ELEMENTS] = new WeakMap<HTMLElement, string>();
  private [REGISTERED_ELEMENTS_SET] = new Set<HTMLElement>();
  private [IS_UPDATING] = false;

  /**
   * Unique immutable identifier for this context instance
   */
  readonly id: number;

  /**
   * Application context (theme, auth, config, etc.)
   */
  application: AppContext;

  /**
   * Navigation state
   */
  navigation: NavContext;

  /**
   * Fetch function with optional middleware support
   * Bound to this Context instance, allowing middleware to access application and navigation state
   */
  fetch: typeof globalThis.fetch;

  constructor(context: AppContext = {}, placards: Placard[] = [], currentRoute = '', routeParams: RouteParams = {}, fetcher?: Fetcher) {
    this.id = contextIdCounter++;
    this.application = context;
    this.navigation = {
      placards,
      route: currentRoute,
      params: routeParams
    };

    // Initialize fetch with middleware support or fallback to native fetch
    if (fetcher && typeof fetcher.create === 'function') {
      this.fetch = fetcher.create(this);
    } else if (typeof fetch === 'function') {
      this.fetch = fetch.bind(this);
    } else {
      throw new Error('No fetch implementation available');
    }
  }

  /**
   * Register an element to receive context updates
   * @internal Used by @context decorator
   */
  [CONTEXT_REGISTER](element: HTMLElement, methodName: string): void {
    (this[REGISTERED_ELEMENTS] as WeakMap<HTMLElement, string>).set(element, methodName);
    (this[REGISTERED_ELEMENTS_SET] as Set<HTMLElement>).add(element);
  }

  /**
   * Unregister an element from receiving context updates
   * @internal Used by @context decorator cleanup
   */
  [CONTEXT_UNREGISTER](element: HTMLElement): void {
    (this[REGISTERED_ELEMENTS] as WeakMap<HTMLElement, string>).delete(element);
    (this[REGISTERED_ELEMENTS_SET] as Set<HTMLElement>).delete(element);
  }

  /**
   * Update the context and notify all registered elements
   * Prevents infinite loops by tracking update state
   * @internal Used by Router during navigation
   */
  [CONTEXT_UPDATE](context: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams): void {
    this.application = context;
    this.navigation.placards = placards;
    this.navigation.route = currentRoute;
    this.navigation.params = routeParams;
    this.notify();
  }

  /**
   * Signal all @context() subscribers to re-read context
   * Does not modify any state — just notifies listeners with current values
   */
  update(): void {
    this.notify();
  }

  private notify(): void {
    // Prevent infinite loops
    if (this[IS_UPDATING]) {
      return;
    }

    this[IS_UPDATING] = true;

    // Notify all registered elements by calling their methods directly
    const elementsSet = this[REGISTERED_ELEMENTS_SET] as Set<HTMLElement>;
    const elementsMap = this[REGISTERED_ELEMENTS] as WeakMap<HTMLElement, string>;

    for (const element of elementsSet) {
      const methodName = elementsMap.get(element);
      if (methodName && typeof (element as any)[methodName] === 'function') {
        try {
          (element as any)[methodName](this);
        } catch (error) {
          // Log error but continue notifying other elements
          console.error(`Error calling @context method ${methodName}:`, error);
        }
      }
    }

    this[IS_UPDATING] = false;
  }

  /**
   * Notify a specific element of the current context state
   * @internal Used by @context decorator
   */
  [CONTEXT_NOTIFY_ELEMENT](element: HTMLElement): void {
    const methodName = (this[REGISTERED_ELEMENTS] as WeakMap<HTMLElement, string>).get(element);
    if (methodName && typeof (element as any)[methodName] === 'function') {
      (element as any)[methodName](this);
    }
  }
}
