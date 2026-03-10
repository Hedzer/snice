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
  const win = options.window ?? window;
  const doc = options.document ?? document;
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
      if (!win.customElements.get(pageOptions.tag)) {
        win.customElements.define(pageOptions.tag, constructor);
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

    switch (route) {
      case '/404': _404 = tag; break;
      case '/403': _403 = tag; break;
      case '/': home = tag; break;
    }
  }

  function setupEventListeners(): void {
    const handler = () => {
      if (!doc.querySelector(options.target)) return;
      navigate(getPath());
    };

    switch (options.type) {
      case 'hash':
        win.addEventListener('hashchange', handler);
        break;
      case 'pushstate':
        win.addEventListener('popstate', handler);
        break;
    }
  }

  /**
   * Initializes the router and sets up navigation event listeners.
   * @example
   * initialize();
   */
  function initialize(): void {
    const target = doc.querySelector(options.target);
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
    const seen = new Set<string>();
    placards = routes
      .filter(route => route.placard)
      .map(route => {
        const placard = route.placard!;
        return typeof placard === 'function'
          ? placard(context as AppContext)
          : placard;
      })
      .filter(p => {
        if (seen.has(p.name)) return false;
        seen.add(p.name);
        return true;
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
        return win.location.hash.slice(1);
      case 'pushstate':
        return win.location.pathname;
    }
  }
  
  function renderForbiddenPage(target: Element): void {
    let newPageElement: HTMLElement;

    if (_403) {
      newPageElement = doc.createElement(_403);
      (newPageElement as any)[ROUTER_CONTEXT] = context;
    } else {
      const div = doc.createElement('div');
      div.className = 'default-403';
      div.innerHTML = /*html*/`<h1>403</h1><p>Unauthorized</p>`;
      newPageElement = div;
    }

    target.innerHTML = '';
    target.appendChild(newPageElement);
    currentLayoutName = null;
    currentLayoutTimestamp = null;
  }

  function createLoadingSpinner(): HTMLElement {
    const container = doc.createElement('div');
    container.setAttribute('data-snice-loading', '');
    container.innerHTML = /*html*/`
      <style>@keyframes snice-spin{to{transform:rotate(360deg)}}</style>
      <div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:200px">
        <div style="width:32px;height:32px;border:3px solid rgba(128,128,128,0.3);border-top-color:rgba(128,128,128,0.8);border-radius:50%;animation:snice-spin 0.6s linear infinite"></div>
      </div>`;
    return container;
  }

  async function checkGuards(guards: Guard<any> | Guard<any>[] | undefined, params: RouteParams, target: Element): Promise<boolean> {
    const hasGuards = !!guards;
    if (!hasGuards) {
      return true;
    }

    const guardsArray = Array.isArray(guards) ? guards : [guards];
    let spinner: HTMLElement | null = null;
    let spinnerTimer: ReturnType<typeof setTimeout> | null = null;

    // Show spinner after a short delay (avoids flash for fast sync guards)
    spinnerTimer = setTimeout(() => {
      spinner = createLoadingSpinner();
      target.appendChild(spinner);
    }, 50);

    try {
      for (const guard of guardsArray) {
        const allowed = await guard(context, params);
        if (!allowed) {
          renderForbiddenPage(target);
          return false;
        }
      }
      return true;
    } finally {
      if (spinnerTimer) clearTimeout(spinnerTimer);
      if (spinner) spinner.remove();
    }
  }

  function createHomeElement(): { element: HTMLElement; transition?: Transition; layout?: string | false } {
    const newPageElement = doc.createElement(home);
    (newPageElement as any)[ROUTER_CONTEXT] = context;
    const constructor = win.customElements.get(home);
    const transition = (constructor as any)?.[PAGE_TRANSITION];
    
    const homeRoute = routes.find(r => r.route.match('/'));
    return { element: newPageElement, transition, layout: homeRoute?.layout };
  }

  function create404Element(): { element: HTMLElement; transition?: Transition; layout?: string | false } {
    const has404Page = !!_404;
    
    if (has404Page) {
      const newPageElement = doc.createElement(_404);
      (newPageElement as any)[ROUTER_CONTEXT] = context;
      const constructor = win.customElements.get(_404);
      const transition = (constructor as any)?.[PAGE_TRANSITION];
      return { element: newPageElement, transition, layout: undefined };
    }
    
    const div = doc.createElement('div');
    div.className = 'default-404';
    div.innerHTML = /*html*/`<h1>404</h1><p>Page not found</p>`;
    return { element: div, transition: undefined, layout: undefined };
  }

  async function resolveRoute(path: string, target: Element): Promise<{ result: RouteResult; element?: HTMLElement; transition?: Transition; layout?: string | false; routeParams?: RouteParams }> {
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

      const newPageElement = doc.createElement(route.tag);
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
      
      const layoutElement = doc.createElement(layoutToUse);
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

  async function renderPage(target: Element, pageElement: HTMLElement, transition: Transition | undefined, layout: string | false | undefined, path: string, routeParams: RouteParams): Promise<void> {
    const layoutToUse = determineLayout(layout);
    const { element: layoutElement, needsNewLayout } = setupLayout(layoutToUse);
    const finalTransition = transition || options.transition;

    const hasLayout = layoutElement !== null || getCurrentLayoutElement(target) !== null;
    if (hasLayout) {
      await renderWithLayout(target, pageElement, finalTransition, layoutElement, needsNewLayout, path, routeParams);
      emitContextUpdate(target, path, routeParams);
      return;
    }

    await renderDirect(target, pageElement, finalTransition);
    emitContextUpdate(target, path, routeParams);
  }

  /**
   * Navigates to the specified path.
   * @param {string} path - The path to navigate to.
   * @example
   * navigate('/login');
   */
  async function navigate(path: string): Promise<void> {
    const target = doc.querySelector(options.target);
    if (!target) {
      throw new Error(`Target element not found: ${options.target}`);
    }

    collectPlacards();
    win.scrollTo(0, 0);

    // Home path
    const isHomePath = (path?.trim() === '' || path === '/') && !!home;
    if (isHomePath) {
      const homeRoute = routes.find(r => r.route.match('/'));
      if (!(await checkGuards(homeRoute?.guards, {}, target))) return;
      const { element, transition, layout } = createHomeElement();
      await renderPage(target, element, transition, layout, path, {});
      return;
    }

    // No path
    if (!path) return;

    // Resolve route
    const routeResult = await resolveRoute(path, target);

    // Guards failed (403 already rendered by checkGuards)
    if (routeResult.result === RouteResult.GUARDS_FAILED) return;

    // Route matched
    if (routeResult.result === RouteResult.SUCCESS) {
      const { element, transition, layout, routeParams = {} } = routeResult;
      await renderPage(target, element!, transition, layout, path, routeParams);
      return;
    }

    // 404 fallthrough
    const { element, transition, layout } = create404Element();
    await renderPage(target, element, transition, layout, path, {});
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