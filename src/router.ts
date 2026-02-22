import { Route } from 'pica-route';
import { applyElementFunctionality } from './element';
import { ROUTER_CONTEXT, CONTEXT_REQUEST_HANDLER, PAGE_TRANSITION, CREATED_AT, PROPERTIES, CONTEXT_HANDLER, CONTEXT_UPDATE } from './symbols';
import { performTransition as performTransitionUtil } from './transitions';
import { Transition } from './types/transition';
import { RouterOptions } from './types/router-options';
import { PageOptions } from './types/page-options';
import { Guard } from './types/guard';
import { RouteParams } from 'pica-route';
import { RouterInstance } from './types/router-instance';
import { Placard } from './types/placard';
import { AppContext } from './types/app-context';
import { Context } from './types/context';


/**
 * Possible outcomes from route resolution
 */
enum RouteResult {
  SUCCESS = 'success',
  GUARDS_FAILED = 'guards-failed',
  NOT_FOUND = 'not-found'
}


/**
 * Creates a new router instance.
 * @param {RouterOptions} options - The router configuration options.
 * @returns An object containing the router's API methods.
 */
export function Router(options: RouterOptions): RouterInstance {
  const routes: { route: Route, tag: string, transition?: Transition, guards?: Guard<any> | Guard<any>[], layout?: string | false, placard?: Placard | ((context: AppContext) => Placard) }[] = [];
  let is_sorted = false;
  let placards: Placard[] = []; // Store collected placards

  let _404: string; // the 404 page
  let _403: string; // the 403 forbidden page
  let home: string; // the home page
  let currentLayoutName: string | null = null; // Track current layout name
  let currentLayoutTimestamp: number | null = null; // Track current layout timestamp
  const context = options.context || {}; // Store context for guards

  // Create Context instance for managing router state
  const navigationContext = new Context(context, [], '', {}, options.fetcher);

  function getCurrentLayoutElement(target: Element): HTMLElement | null {
    const noCurrentLayout = !currentLayoutName || !currentLayoutTimestamp;
    if (noCurrentLayout) {
      return null;
    }
    
    const layoutElements = target.querySelectorAll(currentLayoutName!) as NodeListOf<HTMLElement>;
    
    for (const element of layoutElements) {
      const hasTimestamp = (element as any)[CREATED_AT] === currentLayoutTimestamp;
      if (hasTimestamp) {
        return element;
      }
    }
    
    return null;
  }

  /**
   * Decorator function for defining a page with associated routes.
   * @param {PageOptions} pageOptions - The page configuration options.
   * @returns A decorator function to apply to a custom element class.
   */
  function page(pageOptions: PageOptions) {
    return function <C extends { new(...args: any[]): HTMLElement }>(constructor: C, context: ClassDecoratorContext) {
      // Transfer metadata from context to constructor (for new decorators)
      if (context?.metadata && (context.metadata as any)[PROPERTIES]) {
        if (!(constructor as any)[PROPERTIES]) {
          (constructor as any)[PROPERTIES] = new Map();
        }
        for (const [key, value] of (context.metadata as any)[PROPERTIES]) {
          (constructor as any)[PROPERTIES].set(key, value);
        }
      }

      // Apply all element functionality (properties, queries, watchers, controllers, etc.)
      applyElementFunctionality(constructor);
      
      // Store transition config on constructor for later use
      (constructor as any)[PAGE_TRANSITION] = pageOptions.transition;
      
      // Extend the connectedCallback to add router-specific functionality
      const elementConnectedCallback = constructor.prototype.connectedCallback;
      constructor.prototype.connectedCallback = function() {
        // Store the Context instance for @context decorated methods to access
        (this as any)[CONTEXT_HANDLER] = navigationContext;

        // Call the element's connectedCallback first
        elementConnectedCallback?.call(this);
      };
      
      // Extend the disconnectedCallback to clean up router-specific stuff
      const elementDisconnectedCallback = constructor.prototype.disconnectedCallback;
      constructor.prototype.disconnectedCallback = function() {
        // Call element's disconnectedCallback first
        elementDisconnectedCallback?.call(this);

        // Clean up context references
        delete (this as any)[ROUTER_CONTEXT];
        delete (this as any)[CONTEXT_HANDLER];
      };
      
      // Define the custom element (skip if already registered)
      if (customElements.get(pageOptions.tag)) {
        console.warn(`[snice] Page "${pageOptions.tag}" is already registered. Skipping duplicate registration.`);
      } else {
        customElements.define(pageOptions.tag, constructor);
      }

      // Register the routes with guards, layout, and placard
      pageOptions.routes.forEach(route => register(route, pageOptions.tag, pageOptions.transition, pageOptions.guards, pageOptions.layout, pageOptions.placard));

      return constructor;
    }
  }

  /**
   * Registers a new route with the router.
   * @param {string} route - The route path.
   * @param {string} tag - The custom element tag associated with the route.
   * @example
   * register('/custom-route', 'custom-element');
   */
  function register(route: string, tag: string, transition?: Transition, guards?: Guard<any> | Guard<any>[], layout?: string | false, placard?: Placard | ((context: AppContext) => Placard)): void {
    routes.push({ route: new Route(route), tag, transition, guards, layout, placard });
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
    const target = document.querySelector(options.target);
    if (!target) {
      throw new Error(`Target element not found: ${options.target}`);
    }

    const needsSorting = !is_sorted;
    if (needsSorting) {
      routes.sort((a: any, b: any) => b.route.spec.length - a.route.spec.length);
      is_sorted = true;
    }

    // Collect placards from registered routes
    collectPlacards();

    setupEventListeners();

    const path = getPath();
    navigate(path);
  }

  function collectPlacards(): void {
    placards = routes
      .filter(route => route.placard)
      .map(route => {
        const placard = route.placard!;
        return typeof placard === 'function'
          ? placard(context as AppContext)
          : placard;
      });
  }

  // Symbol for storing the navigation context on page elements
  const ROUTER_CONTEXT_SYMBOL = Symbol.for('router-context');

  function emitContextUpdate(target: Element, currentPath: string, routeParams: RouteParams): void {
    // Update the navigation context and notify all registered elements
    (navigationContext[CONTEXT_UPDATE] as Function)(context, placards, currentPath, routeParams);
  }

  function updateLayout(layoutElement: HTMLElement, currentPath: string, routeParams: RouteParams): void {
    // Check if layout implements the update method
    if (typeof (layoutElement as any).update === 'function') {
      (layoutElement as any).update(context, placards, currentPath, routeParams);
    }
  }
  
  function getPath(): string {
    switch (options.type) {
      case 'hash':
        return window.location.hash.slice(1);
      case 'pushstate':
        return window.location.pathname;
    }
  }
  
  function renderForbiddenPage(target: Element): void {
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
    currentLayoutName = null;
    currentLayoutTimestamp = null;
  }

  function checkGuards(guards: Guard<any> | Guard<any>[] | undefined, params: RouteParams, target: Element): boolean {
    const hasGuards = !!guards;
    if (!hasGuards) {
      return true;
    }

    const guardsArray = Array.isArray(guards) ? guards : [guards];
    for (const guard of guardsArray) {
      const allowed = guard(context, params);
      if (!allowed) {
        renderForbiddenPage(target);
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

  function resolveRoute(path: string, target: Element): { result: RouteResult; element?: HTMLElement; transition?: Transition; layout?: string | false; routeParams?: RouteParams } {
    for (const route of routes) {
      const params = route.route.match(path);
      const isMatch = params !== false;
      if (!isMatch) {
        continue;
      }

      const guardsAllowed = checkGuards(route.guards, params as RouteParams, target);
      if (!guardsAllowed) {
        return { result: RouteResult.GUARDS_FAILED };
      }

      const newPageElement = document.createElement(route.tag);
      (newPageElement as any)[ROUTER_CONTEXT] = context;
      (newPageElement as any)[CONTEXT_HANDLER] = navigationContext;
      const routeParams = params as RouteParams;
      Object.keys(routeParams).forEach(key => newPageElement.setAttribute(key, routeParams[key]));

      return { result: RouteResult.SUCCESS, element: newPageElement, transition: route.transition, layout: route.layout, routeParams };
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

  function setupLayout(layoutToUse: string | null): { element: HTMLElement | null; needsNewLayout: boolean } {
    const needsNewLayout = layoutToUse !== currentLayoutName;
    if (!needsNewLayout) {
      return { element: null, needsNewLayout: false };
    }
    
    currentLayoutName = layoutToUse;
    
    const shouldCreateLayout = !!layoutToUse;
    if (shouldCreateLayout) {
      const timestamp = Date.now();
      currentLayoutTimestamp = timestamp;
      
      const layoutElement = document.createElement(layoutToUse);
      (layoutElement as any)[ROUTER_CONTEXT] = context;
      (layoutElement as any)[CREATED_AT] = timestamp;
      
      return { element: layoutElement, needsNewLayout: true };
    }
    
    currentLayoutTimestamp = null;
    return { element: null, needsNewLayout: true };
  }

  async function renderWithLayout(target: Element, pageElement: HTMLElement, transition: Transition | undefined, layoutElement: HTMLElement | null, needsNewLayout: boolean, currentPath: string, routeParams: RouteParams): Promise<void> {
    const currentLayout = layoutElement || getCurrentLayoutElement(target);
    if (!currentLayout) {
      return;
    }

    // Update layout with current context and placards
    updateLayout(currentLayout, currentPath, routeParams);

    const oldPageInLayout = currentLayout.querySelector('[slot="page"]') as HTMLElement | null;
    const shouldTransition = !!(transition && oldPageInLayout);

    if (shouldTransition) {
      pageElement.setAttribute('slot', 'page');
      await performTransition(currentLayout, oldPageInLayout!, pageElement, transition!);
      if (needsNewLayout) {
        target.innerHTML = '';
        target.appendChild(currentLayout);
      }
      return;
    }

    const existingPages = currentLayout.querySelectorAll('[slot="page"]');
    existingPages.forEach(page => page.remove());
    pageElement.setAttribute('slot', 'page');
    currentLayout.appendChild(pageElement);

    if (needsNewLayout) {
      target.innerHTML = '';
      target.appendChild(currentLayout);
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

    // Collect fresh placards before navigation
    collectPlacards();

    window.scrollTo(0, 0);

    const isHomePath = (path?.trim() === '' || path === '/') && !!home;
    
    if (isHomePath) {
      const homeRoute = routes.find(r => r.route.match('/'));
      const guardsAllowed = checkGuards(homeRoute?.guards, {}, target);
      if (!guardsAllowed) {
        return;
      }

      const { element, transition, layout } = createHomeElement();
      const layoutToUse = determineLayout(layout);
      const { element: layoutElement, needsNewLayout } = setupLayout(layoutToUse);
      const finalTransition = transition || options.transition;

      const hasLayout = layoutElement !== null || getCurrentLayoutElement(target) !== null;
      if (hasLayout) {
        await renderWithLayout(target, element, finalTransition, layoutElement, needsNewLayout, path, {});
        emitContextUpdate(target, path, {});
        return;
      }

      await renderDirect(target, element, finalTransition);
      emitContextUpdate(target, path, {});
      return;
    }

    if (!path) return;
    const routeResult = resolveRoute(path, target);
    
    const isGuardsFailed = routeResult.result === RouteResult.GUARDS_FAILED;
    if (isGuardsFailed) {
      return;
    }
    
    const isSuccess = routeResult.result === RouteResult.SUCCESS;
    if (isSuccess) {
      const { element, transition, layout, routeParams = {} } = routeResult;
      const layoutToUse = determineLayout(layout);
      const { element: layoutElement, needsNewLayout } = setupLayout(layoutToUse);
      const finalTransition = transition || options.transition;

      const hasLayout = layoutElement !== null || getCurrentLayoutElement(target) !== null;
      if (hasLayout) {
        await renderWithLayout(target, element!, finalTransition, layoutElement, needsNewLayout, path, routeParams);
        emitContextUpdate(target, path, routeParams);
        return;
      }

      await renderDirect(target, element!, finalTransition);
      emitContextUpdate(target, path, routeParams);
      return;
    }
    
    const { element, transition, layout } = create404Element();
    const layoutToUse = determineLayout(layout);
    const { element: layoutElement, needsNewLayout } = setupLayout(layoutToUse);
    const finalTransition = transition || options.transition;

    const hasLayout = layoutElement !== null || getCurrentLayoutElement(target) !== null;
    if (hasLayout) {
      await renderWithLayout(target, element, finalTransition, layoutElement, needsNewLayout, path, {});
      emitContextUpdate(target, path, {});
      return;
    }

    await renderDirect(target, element, finalTransition);
    emitContextUpdate(target, path, {});
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
    register
  };
}