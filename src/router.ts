import Route from 'route-parser';
import { applyElementFunctionality } from './element';
import { ROUTER_CONTEXT, CONTEXT_REQUEST_HANDLER, PAGE_TRANSITION } from './symbols';
import { Transition, performTransition as performTransitionUtil } from './transitions';

/**
 * Route parameters extracted from the URL
 */
export type RouteParams = Record<string, string>;

/**
 * Possible outcomes from route resolution
 */
enum RouteResult {
  SUCCESS = 'success',
  GUARDS_FAILED = 'guards-failed',
  NOT_FOUND = 'not-found'
}

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

  function setupEventListeners(): void {
    const isHashType = options.type === 'hash';
    const isPushStateType = options.type === 'pushstate';
    
    if (isHashType) {
      window.addEventListener('hashchange', () => {
        const targetExists = !!document.querySelector(options.target);
        if (!targetExists) {
          return;
        }
        
        const path = getPath();
        navigate(path);
      });
    }
    
    if (isPushStateType) {
      window.addEventListener('popstate', () => {
        const targetExists = !!document.querySelector(options.target);
        if (!targetExists) {
          return;
        }
        
        const path = getPath();
        navigate(path);
      });
    }
  }

  /**
   * Initializes the router and sets up navigation event listeners.
   * @example
   * initialize();
   */
  function initialize(): void {
    const targetExists = !!document.querySelector(options.target);
    if (!targetExists) {
      throw new Error(`Target element not found: ${options.target}`);
    }
    
    const needsSorting = !is_sorted;
    if (needsSorting) {
      routes.sort((a: any, b: any) => b.route.spec.length - a.route.spec.length);
      is_sorted = true;
    }

    setupEventListeners();

    const path = getPath();
    navigate(path);
  }
  
  function getPath(): string {
    switch (options.type) {
      case 'hash':
        return window.location.hash.slice(1);
      case 'pushstate':
        return window.location.pathname;
    }
  }
  
  async function renderForbiddenPage(target: Element): Promise<void> {
    let newPageElement: HTMLElement;
    const has403Page = !!_403;
    
    if (has403Page) {
      newPageElement = document.createElement(_403);
      (newPageElement as any)[ROUTER_CONTEXT] = context;
    }
    if (!has403Page) {
      const div = document.createElement('div');
      div.className = 'default-403';
      div.innerHTML = /*html*/`<h1>403</h1><p>Unauthorized</p>`;
      newPageElement = div;
    }
    
    target.innerHTML = '';
    target.appendChild(newPageElement!);
    currentLayoutElement = null;
  }

  async function checkGuards(guards: Guard<any> | Guard<any>[] | undefined, params: RouteParams, target: Element): Promise<boolean> {
    const hasGuards = !!guards;
    if (!hasGuards) {
      return true;
    }
    
    const guardsArray = Array.isArray(guards) ? guards : [guards];
    for (const guard of guardsArray) {
      const allowed = await guard(context, params);
      if (!allowed) {
        await renderForbiddenPage(target);
        return false;
      }
    }
    return true;
  }

  function createHomeElement(): { element: HTMLElement; transition?: Transition; layout?: string | false } {
    const newPageElement = document.createElement(home);
    (newPageElement as any)[ROUTER_CONTEXT] = context;
    const constructor = customElements.get(home);
    const transition = (constructor as any)?.[PAGE_TRANSITION];
    
    const homeRoute = routes.find(r => r.route.match('/'));
    return { element: newPageElement, transition, layout: homeRoute?.layout };
  }

  function create404Element(): { element: HTMLElement; transition?: Transition; layout?: string | false } {
    const has404Page = !!_404;
    
    if (has404Page) {
      const newPageElement = document.createElement(_404);
      (newPageElement as any)[ROUTER_CONTEXT] = context;
      const constructor = customElements.get(_404);
      const transition = (constructor as any)?.[PAGE_TRANSITION];
      return { element: newPageElement, transition, layout: undefined };
    }
    
    const div = document.createElement('div');
    div.className = 'default-404';
    div.innerHTML = /*html*/`<h1>404</h1><p>Page not found</p>`;
    return { element: div, transition: undefined, layout: undefined };
  }

  async function resolveRoute(path: string, target: Element): Promise<{ result: RouteResult; element?: HTMLElement; transition?: Transition; layout?: string | false }> {
    for (const route of routes) {
      const params = route.route.match(path);
      const isMatch = params !== false;
      if (!isMatch) {
        continue;
      }
      
      const guardsAllowed = await checkGuards(route.guards, params as RouteParams, target);
      if (!guardsAllowed) {
        return { result: RouteResult.GUARDS_FAILED };
      }
      
      const newPageElement = document.createElement(route.tag);
      (newPageElement as any)[ROUTER_CONTEXT] = context;
      const routeParams = params as RouteParams;
      Object.keys(routeParams).forEach(key => newPageElement.setAttribute(key, routeParams[key]));
      
      return { result: RouteResult.SUCCESS, element: newPageElement, transition: route.transition, layout: route.layout };
    }
    
    return { result: RouteResult.NOT_FOUND };
  }

  function determineLayout(pageLayout: string | false | undefined): string | null {
    const isExplicitlyNoLayout = pageLayout === false;
    if (isExplicitlyNoLayout) {
      return null;
    }
    
    const hasPageLayout = !!pageLayout;
    if (hasPageLayout) {
      return pageLayout;
    }
    
    const hasRouterLayout = !!options.layout;
    if (hasRouterLayout) {
      return options.layout!;
    }
    
    return null;
  }

  function setupLayout(layoutToUse: string | null): boolean {
    const needsNewLayout = layoutToUse !== currentLayoutName;
    if (!needsNewLayout) {
      return false;
    }
    
    currentLayoutElement = null;
    currentLayoutName = layoutToUse;
    
    const shouldCreateLayout = !!layoutToUse;
    if (shouldCreateLayout) {
      currentLayoutElement = document.createElement(layoutToUse);
      (currentLayoutElement as any)[ROUTER_CONTEXT] = context;
    }
    
    return true;
  }

  async function renderWithLayout(target: Element, pageElement: HTMLElement, transition: Transition | undefined, needsNewLayout: boolean): Promise<void> {
    const oldPageInLayout = currentLayoutElement!.querySelector('[slot="page"]') as HTMLElement | null;
    const shouldTransition = !!(transition && oldPageInLayout);
    
    if (shouldTransition) {
      pageElement.setAttribute('slot', 'page');
      await performTransition(currentLayoutElement!, oldPageInLayout!, pageElement, transition!);
      if (needsNewLayout) {
        target.innerHTML = '';
        target.appendChild(currentLayoutElement!);
      }
      return;
    }
    
    const existingPages = currentLayoutElement!.querySelectorAll('[slot="page"]');
    existingPages.forEach(page => page.remove());
    pageElement.setAttribute('slot', 'page');
    currentLayoutElement!.appendChild(pageElement);
    
    if (needsNewLayout) {
      target.innerHTML = '';
      target.appendChild(currentLayoutElement!);
    }
  }

  async function renderDirect(target: Element, pageElement: HTMLElement, transition: Transition | undefined): Promise<void> {
    const currentElementInTarget = target.children[0] as HTMLElement | null;
    const shouldTransition = !!(transition && currentElementInTarget);
    
    if (shouldTransition) {
      await performTransition(target, currentElementInTarget!, pageElement, transition!);
      return;
    }
    
    target.innerHTML = '';
    target.appendChild(pageElement);
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

    window.scrollTo(0, 0);

    const isHomePath = (path.trim() === '' || path === '/') && !!home;
    
    if (isHomePath) {
      const homeRoute = routes.find(r => r.route.match('/'));
      const guardsAllowed = await checkGuards(homeRoute?.guards, {}, target);
      if (!guardsAllowed) {
        return;
      }
      
      const { element, transition, layout } = createHomeElement();
      const layoutToUse = determineLayout(layout);
      const needsNewLayout = setupLayout(layoutToUse);
      const finalTransition = transition || options.transition;
      
      const hasLayout = !!currentLayoutElement;
      if (hasLayout) {
        await renderWithLayout(target, element, finalTransition, needsNewLayout);
        return;
      }
      
      await renderDirect(target, element, finalTransition);
      return;
    }
    
    const routeResult = await resolveRoute(path, target);
    
    const isGuardsFailed = routeResult.result === RouteResult.GUARDS_FAILED;
    if (isGuardsFailed) {
      return;
    }
    
    const isSuccess = routeResult.result === RouteResult.SUCCESS;
    if (isSuccess) {
      const { element, transition, layout } = routeResult;
      const layoutToUse = determineLayout(layout);
      const needsNewLayout = setupLayout(layoutToUse);
      const finalTransition = transition || options.transition;
      
      const hasLayout = !!currentLayoutElement;
      if (hasLayout) {
        await renderWithLayout(target, element!, finalTransition, needsNewLayout);
        return;
      }
      
      await renderDirect(target, element!, finalTransition);
      return;
    }
    
    const { element, transition, layout } = create404Element();
    const layoutToUse = determineLayout(layout);
    const needsNewLayout = setupLayout(layoutToUse);
    const finalTransition = transition || options.transition;
    
    const hasLayout = !!currentLayoutElement;
    if (hasLayout) {
      await renderWithLayout(target, element, finalTransition, needsNewLayout);
      return;
    }
    
    await renderDirect(target, element, finalTransition);
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