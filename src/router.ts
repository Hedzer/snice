import Route from 'route-parser';
import { applyElementFunctionality } from './element';
import { ROUTER_CONTEXT, CONTEXT_REQUEST_HANDLER, PAGE_TRANSITION } from './symbols';
import { Transition, performTransition as performTransitionUtil } from './transitions';

/**
 * Route parameters extracted from the URL
 */
export type RouteParams = Record<string, string>;

/**
 * Guard function that determines if navigation is allowed
 * @param context The application context
 * @param params The URL parameters from the route
 */
export type Guard<T = any> = (context: T, params: RouteParams) => boolean | Promise<boolean>;

export interface RouterOptions {
  /**
   * The target element selector where the page element will be instantiated.
   * The router will use this selector to find the target element, clear it, and append the page element to it.
   */
  target: string;
  
  /**
   * Whether to use hash routing or push state routing.
   */
  type: 'hash' | 'pushstate';

  /**
   * Override for the window object to use for routing, defaults to global.
   */
  window?: Window;

  /**
   * Override for the document object to use for routing, defaults to global.
   */
  document?: Document;
  
  /**
   * Global transition configuration for all pages
   */
  transition?: Transition;
  
  /**
   * Optional context object passed to guard functions
   */
  context?: any;
  
  /**
   * Default layout element tag name for all pages
   */
  layout?: string;
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

/**
 * Router return type
 */
export interface RouterInstance {
  page: (pageOptions: PageOptions) => <C extends { new(...args: any[]): HTMLElement }>(constructor: C) => void;
  initialize: () => void;
  navigate: (path: string) => Promise<void>;
  register: (route: string, tag: string, transition?: Transition, guards?: Guard<any> | Guard<any>[]) => void;
  context: any;
}

/**
 * Creates a new router instance.
 * @param {RouterOptions} options - The router configuration options.
 * @returns An object containing the router's API methods.
 */
export function Router(options: RouterOptions): RouterInstance {
  const routes: { route: Route, tag: string, transition?: Transition, guards?: Guard<any> | Guard<any>[], layout?: string | false }[] = [];
  let is_sorted = false;

  let _404: string; // the 404 page
  let _403: string; // the 403 forbidden page
  let home: string; // the home page
  let currentLayoutElement: HTMLElement | null = null; // Track current layout
  let currentLayoutName: string | null = null; // Track current layout name
  const context = options.context || {}; // Store context for guards

  /**
   * Decorator function for defining a page with associated routes.
   * @param {PageOptions} pageOptions - The page configuration options.
   * @returns A decorator function to apply to a custom element class.
   */
  function page(pageOptions: PageOptions) {
    return function <C extends { new(...args: any[]): HTMLElement }>(constructor: C) {
      // Apply all element functionality (properties, queries, watchers, controllers, etc.)
      applyElementFunctionality(constructor);
      
      // Store transition config on constructor for later use
      (constructor as any)[PAGE_TRANSITION] = pageOptions.transition;
      
      // Extend the connectedCallback to add router-specific functionality
      const elementConnectedCallback = constructor.prototype.connectedCallback;
      constructor.prototype.connectedCallback = function() {
        // Call the element's connectedCallback first
        elementConnectedCallback?.call(this);
        
        // Setup context request handler for nested elements
        const contextRequestHandler = (event: any) => {
          // Only respond if this element has context
          if (this[ROUTER_CONTEXT] !== undefined) {
            event.detail.context = this[ROUTER_CONTEXT];
            event.stopPropagation(); // Stop bubbling once context is provided
          }
        };
        this.addEventListener('@context/request', contextRequestHandler);
        
        // Store handler for cleanup
        (this as any)[CONTEXT_REQUEST_HANDLER] = contextRequestHandler;
      };
      
      // Extend the disconnectedCallback to clean up router-specific stuff
      const elementDisconnectedCallback = constructor.prototype.disconnectedCallback;
      constructor.prototype.disconnectedCallback = function() {
        // Call element's disconnectedCallback first
        elementDisconnectedCallback?.call(this);
        
        // Clean up context request handler
        const handler = (this as any)[CONTEXT_REQUEST_HANDLER];
        if (handler) {
          this.removeEventListener('@context/request', handler);
          delete (this as any)[CONTEXT_REQUEST_HANDLER];
        }
        
        // Clean up context reference
        delete (this as any)[ROUTER_CONTEXT];
      };
      
      // Define the custom element
      customElements.define(pageOptions.tag, constructor);

      // Register the routes with guards and layout
      pageOptions.routes.forEach(route => register(route, pageOptions.tag, pageOptions.transition, pageOptions.guards, pageOptions.layout));
    }
  }

  /**
   * Registers a new route with the router.
   * @param {string} route - The route path.
   * @param {string} tag - The custom element tag associated with the route.
   * @example
   * register('/custom-route', 'custom-element');
   */
  function register(route: string, tag: string, transition?: Transition, guards?: Guard<any> | Guard<any>[], layout?: string | false): void {
    routes.push({ route: new Route(route), tag, transition, guards, layout });
    is_sorted = false;

    if (route === '/404') {
      _404 = tag;
    }
    
    if (route === '/403') {
      _403 = tag;
    }

    if (route === '/') {
      home = tag;
    }
  }

  /**
   * Initializes the router and sets up navigation event listeners.
   * @example
   * initialize();
   */
  function initialize(): void {
    // Check if target exists before initializing
    if (!document.querySelector(options.target)) {
      throw new Error(`Target element not found: ${options.target}`);
    }
    
    if (!is_sorted) {
      routes.sort((a: any, b: any) => b.route.spec.length - a.route.spec.length);
      is_sorted = true;
    }

    // Listen for navigation events
    switch (options.type) {
      case 'hash':
        window.addEventListener('hashchange', () => {
          // Only navigate if target still exists
          if (document.querySelector(options.target)) {
            const path = get_path();
            navigate(path);
          }
        });
        break;
      case 'pushstate':
        window.addEventListener('popstate', () => {
          // Only navigate if target still exists
          if (document.querySelector(options.target)) {
            const path = get_path();
            navigate(path);
          }
        });
        break;
    }

    const path = get_path();
    navigate(path);
  }
  
  function get_path(): string {
    switch (options.type) {
      case 'hash':
        return window.location.hash.slice(1);
      case 'pushstate':
        return window.location.pathname;
    }
  }
  
  /**
   * Navigates to the specified path.
   * @param {string} path - The path to navigate to.
   * @example
   * navigate('/login');
   */
  async function navigate(path: string): Promise<void> {
    const target = document.querySelector(options.target);
    if (!target) {
      throw new Error(`Target element not found: ${options.target}`);
    }

    // Reset scroll position to top immediately on page change
    window.scrollTo(0, 0);

    let newPageElement: HTMLElement | null = null;
    let transition: Transition | undefined;
    let guards: Guard<any> | Guard<any>[] | undefined;
    let pageLayout: string | false | undefined;

    // Home
    if ((path.trim() === '' || path === '/') && home) {
      // Find home route to get guards and layout
      const homeRoute = routes.find(r => r.route.match('/'));
      guards = homeRoute?.guards;
      pageLayout = homeRoute?.layout;
      
      // Check guards before creating element
      if (guards) {
        const guardsArray = Array.isArray(guards) ? guards : [guards];
        for (const guard of guardsArray) {
          const allowed = await guard(context, {});  // No params for home route
          if (!allowed) {
            // Render 403 page without layout
            if (_403) {
              newPageElement = document.createElement(_403);
              (newPageElement as any)[ROUTER_CONTEXT] = context;
            } else {
              const div = document.createElement('div');
              div.className = 'default-403';
              div.innerHTML = '<h1>403</h1><p>Unauthorized</p>';
              newPageElement = div;
            }
            target.innerHTML = '';
            if (newPageElement) {
              target.appendChild(newPageElement);
            }
            currentPageElement = newPageElement;
            currentLayoutElement = null;
            return;
          }
        }
      }
      
      newPageElement = document.createElement(home);
      (newPageElement as any)[ROUTER_CONTEXT] = context;
      const constructor = customElements.get(home);
      transition = (constructor as any)?.[PAGE_TRANSITION];
    } else {
      // Get the current route
      for (const route of routes) {
        const params = route.route.match(path);
        const is_match = params !== false;

        if (is_match) {
          pageLayout = route.layout;
          
          // Check guards before creating element
          if (route.guards) {
            const guardsArray = Array.isArray(route.guards) ? route.guards : [route.guards];
            for (const guard of guardsArray) {
              const allowed = await guard(context, params as RouteParams);
              if (!allowed) {
                // Render 403 page without layout
                if (_403) {
                  newPageElement = document.createElement(_403);
                  (newPageElement as any)[ROUTER_CONTEXT] = context;
                } else {
                  const div = document.createElement('div');
                  div.className = 'default-403';
                  div.innerHTML = '<h1>403</h1><p>Unauthorized</p>';
                  newPageElement = div;
                }
                target.innerHTML = '';
                if (newPageElement) {
                  target.appendChild(newPageElement);
                }
                currentPageElement = newPageElement;
                currentLayoutElement = null;
                return;
              }
            }
          }
          
          newPageElement = document.createElement(route.tag);
          (newPageElement as any)[ROUTER_CONTEXT] = context;
          Object.keys(params).forEach(key => newPageElement!.setAttribute(key, params[key]));
          transition = route.transition;
          break;
        }
      }
    }

    // 404
    if (!newPageElement) {
      if (_404) {
        newPageElement = document.createElement(_404);
        (newPageElement as any)[ROUTER_CONTEXT] = context;
        const constructor = customElements.get(_404);
        transition = (constructor as any)?.[PAGE_TRANSITION];
      } else {
        const div = document.createElement('div');
        div.className = 'default-404';
        div.innerHTML = '<h1>404</h1><p>Page not found</p>';
        newPageElement = div;
      }
      pageLayout = false; // 404 gets no layout
    }

    // Determine layout to use: page layout takes precedence, then router default
    let layoutToUse: string | null = null;
    if (pageLayout === false) {
      layoutToUse = null; // Explicitly no layout
    } else if (pageLayout) {
      layoutToUse = pageLayout; // Page-specific layout
    } else if (options.layout) {
      layoutToUse = options.layout; // Router default layout
    }

    // Handle layout changes - only recreate if layout name actually changed
    const needsNewLayout = layoutToUse !== currentLayoutName;
    
    if (needsNewLayout) {
      // Clear current layout
      currentLayoutElement = null;
      currentLayoutName = layoutToUse;
      
      // Create new layout if needed
      if (layoutToUse) {
        currentLayoutElement = document.createElement(layoutToUse);
        (currentLayoutElement as any)[ROUTER_CONTEXT] = context;
      }
    }


    // Use page-specific or global transition
    transition = transition || options.transition;

    // Handle layout case vs direct case
    if (currentLayoutElement) {
      // Layout mode: transition between pages within the layout
      const oldPageInLayout = currentLayoutElement.querySelector('[slot="page"]') as HTMLElement | null;
      
      if (transition && oldPageInLayout && newPageElement) {
        newPageElement.setAttribute('slot', 'page');
        await performTransition(currentLayoutElement, oldPageInLayout, newPageElement, transition);
      } else {
        // No transition, just swap pages in layout
        const existingPages = currentLayoutElement.querySelectorAll('[slot="page"]');
        existingPages.forEach(page => page.remove());
        
        if (newPageElement) {
          newPageElement.setAttribute('slot', 'page');
          currentLayoutElement.appendChild(newPageElement);
        }
      }
      
      // Ensure layout is in target (for new layouts)
      if (needsNewLayout) {
        target.innerHTML = '';
        target.appendChild(currentLayoutElement);
      }
    } else {
      // Direct mode: page goes directly in target (original behavior)
      const currentElementInTarget = target.children[0] as HTMLElement | null;
      
      if (transition && currentElementInTarget && newPageElement) {
        await performTransition(target, currentElementInTarget, newPageElement, transition);
      } else {
        // No transition, just swap
        target.innerHTML = '';
        if (newPageElement) {
          target.appendChild(newPageElement);
        }
      }
    }

  }

  async function performTransition(
    container: Element,
    oldElement: HTMLElement,
    newElement: HTMLElement,
    transition: Transition
  ): Promise<void> {
    return performTransitionUtil(container, oldElement, newElement, transition);
  }

  return { 
    page, 
    initialize, 
    navigate, 
    register,
    context,
  };
}