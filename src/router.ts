import Route from 'route-parser';
import { setupEventHandlers, cleanupEventHandlers } from './events';

export interface RouterOptions {
  /**
   * The target element selector where the page element will be instantiated.
   * The router will use this selector to find the target element, clear it, and append the page element to it.
   */
  target: string;
  
  /**
   * Whether to use hash routing or push state routing.
   */
  routing_type: 'hash' | 'pushstate';

  /**
   * Override for the window object to use for routing, defaults to global.
   */
  window?: Window;

  /**
   * Override for the document object to use for routing, defaults to global.
   */
  document?: Document;
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
}

/**
 * Creates a new router instance.
 * @param {RouterOptions} options - The router configuration options.
 * @returns An object containing the router's API methods.
 */
export function Router(options: RouterOptions) {
  const routes: { route: Route, tag: string }[] = [];
  let is_sorted = false;

  let _404: string; // the 404 page
  let home: string; // the home page

  /**
   * Decorator function for defining a page with associated routes.
   * @param {PageOptions} options - The page configuration options.
   * @returns A decorator function to apply to a custom element class.
   */
  function page(pageOptions: PageOptions) {
    return function <T extends { new(...args: any[]): HTMLElement }>(constructor: T) {
      // Add event handler support
      const originalConnectedCallback = constructor.prototype.connectedCallback;
      const originalDisconnectedCallback = constructor.prototype.disconnectedCallback;
      
      constructor.prototype.connectedCallback = function() {
        // Create shadow root if it doesn't exist
        if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' });
        }
        
        // Build the shadow DOM content
        let shadowContent = '';
        
        // Add HTML first (maintaining original order)
        if (this.html) {
          const htmlContent = this.html();
          if (htmlContent !== undefined) {
            shadowContent += htmlContent;
          }
        }
        
        // Add CSS after HTML (maintaining original order)
        if (this.css) {
          const cssResult = this.css();
          if (cssResult) {
            // Handle both string and array of strings
            const cssContent = Array.isArray(cssResult) ? cssResult.join('\n') : cssResult;
            // No need for scoping with Shadow DOM, but add data attribute for compatibility
            shadowContent += `<style data-component-css>${cssContent}</style>`;
          }
        }
        
        // Set shadow DOM content
        if (shadowContent) {
          this.shadowRoot.innerHTML = shadowContent;
        }
        
        originalConnectedCallback?.call(this);
        // Setup @on event handlers - use element for host events, shadow root for delegated events
        setupEventHandlers(this, this);
      };
      
      constructor.prototype.disconnectedCallback = function() {
        originalDisconnectedCallback?.call(this);
        // Cleanup @on event handlers
        cleanupEventHandlers(this);
      };
      
      // Define the custom element
      customElements.define(pageOptions.tag, constructor);

      // Register the routes
      pageOptions.routes.forEach(route => register(route, pageOptions.tag));
    }
  }

  /**
   * Registers a new route with the router.
   * @param {string} route - The route path.
   * @param {string} tag - The custom element tag associated with the route.
   * @example
   * register('/custom-route', 'custom-element');
   */
  function register(route: string, tag: string): void {
    routes.push({ route: new Route(route), tag });
    is_sorted = false;

    if (route === '/404') {
      _404 = tag;
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
    if (!is_sorted) {
      routes.sort((a: any, b: any) => b.route.spec.length - a.route.spec.length);
      is_sorted = true;
    }

    // Listen for navigation events
    switch (options.routing_type) {
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
    switch (options.routing_type) {
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
  function navigate(path: string): void {
    const target = document.querySelector(options.target);
    if (!target) {
      throw new Error(`Target element not found: ${options.target}`);
    }

    // Home
    if ((path.trim() === '' || path === '/') && home) {
      target.innerHTML = '';
      target.appendChild(document.createElement(home));
      return;
    }

    // Get the current route
    for (const route of routes) {
      const params = route.route.match(path);
      const is_match = params !== false; // for human legibility

      if (is_match) {
        // Create the page element
        const pageElement = document.createElement(route.tag);

        // Set the page element's parameters
        Object.keys(params).forEach(key => pageElement.setAttribute(key, params[key]));

        // Clear the target element
        target.innerHTML = '';

        // Append the page element to the target element
        target.appendChild(pageElement);

        return;
      }
    }

    // 404
    if (_404) {
      target.innerHTML = '';
      target.appendChild(document.createElement(_404));
    } else {
      // Provide a default 404 page
      target.innerHTML = '<div class="default-404"><h1>404</h1><p>Page not found</p></div>';
    }        
  }

  return { page, initialize, navigate, register };
}