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
  
  /**
   * Global transition configuration for all pages
   */
  transition?: PageTransition;
}

export interface PageTransition {
  /**
   * Name of the transition (for CSS class naming)
   */
  name?: string;
  
  /**
   * Duration of the out transition in ms
   */
  outDuration?: number;
  
  /**
   * Duration of the in transition in ms
   */
  inDuration?: number;
  
  /**
   * CSS classes or styles for the out transition
   */
  out?: string;
  
  /**
   * CSS classes or styles for the in transition
   */
  in?: string;
  
  /**
   * Mode: 'sequential' (out then in) or 'simultaneous' (both at once)
   */
  mode?: 'sequential' | 'simultaneous';
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
  transition?: PageTransition;
}

/**
 * Creates a new router instance.
 * @param {RouterOptions} options - The router configuration options.
 * @returns An object containing the router's API methods.
 */
export function Router(options: RouterOptions) {
  const routes: { route: Route, tag: string, transition?: PageTransition }[] = [];
  let is_sorted = false;

  let _404: string; // the 404 page
  let home: string; // the home page
  let currentPageElement: HTMLElement | null = null; // Track current page for transitions

  /**
   * Decorator function for defining a page with associated routes.
   * @param {PageOptions} pageOptions - The page configuration options.
   * @returns A decorator function to apply to a custom element class.
   */
  function page(pageOptions: PageOptions) {
    return function <T extends { new(...args: any[]): HTMLElement }>(constructor: T) {
      // Store transition config on constructor for later use
      (constructor as any).__transition = pageOptions.transition;
      // Add event handler support
      const originalConnectedCallback = constructor.prototype.connectedCallback;
      const originalDisconnectedCallback = constructor.prototype.disconnectedCallback;
      
      constructor.prototype.connectedCallback = function() {
        // Call original connectedCallback first to allow property initialization
        originalConnectedCallback?.call(this);
        
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
  function register(route: string, tag: string, transition?: PageTransition): void {
    routes.push({ route: new Route(route), tag, transition });
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
    // Check if target exists before initializing
    if (!document.querySelector(options.target)) {
      throw new Error(`Target element not found: ${options.target}`);
    }
    
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
  async function navigate(path: string): Promise<void> {
    const target = document.querySelector(options.target);
    if (!target) {
      throw new Error(`Target element not found: ${options.target}`);
    }

    let newPageElement: HTMLElement | null = null;
    let transition: PageTransition | undefined;

    // Home
    if ((path.trim() === '' || path === '/') && home) {
      newPageElement = document.createElement(home);
      const constructor = customElements.get(home);
      transition = (constructor as any)?.__transition;
    } else {

      // Get the current route
      for (const route of routes) {
        const params = route.route.match(path);
        const is_match = params !== false;

        if (is_match) {
          newPageElement = document.createElement(route.tag);
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
        const constructor = customElements.get(_404);
        transition = (constructor as any)?.__transition;
      } else {
        // Provide a default 404 page
        const div = document.createElement('div');
        div.className = 'default-404';
        div.innerHTML = '<h1>404</h1><p>Page not found</p>';
        newPageElement = div;
      }
    }

    // Use page-specific or global transition
    transition = transition || options.transition;

    // Perform transition
    if (transition && currentPageElement && currentPageElement.parentElement) {
      await performTransition(target, currentPageElement, newPageElement!, transition);
    } else {
      // No transition, just swap
      target.innerHTML = '';
      if (newPageElement) {
        target.appendChild(newPageElement);
      }
    }

    currentPageElement = newPageElement;
  }

  async function performTransition(
    container: Element,
    oldElement: HTMLElement,
    newElement: HTMLElement,
    transition: PageTransition
  ): Promise<void> {
    const outDuration = transition.outDuration || 300;
    const inDuration = transition.inDuration || 300;
    const mode = transition.mode || 'sequential';

    // Parse CSS properties from transition config
    const parseStyles = (styleString: string): Record<string, string> => {
      const styles: Record<string, string> = {};
      styleString.split(';').forEach(rule => {
        const [prop, value] = rule.split(':').map(s => s.trim());
        if (prop && value) {
          styles[prop] = value;
        }
      });
      return styles;
    };

    // Default transitions
    const outStyles = transition.out ? parseStyles(transition.out) : { opacity: '0' };
    const inStartStyles = { opacity: '0' }; // Always start invisible
    const inEndStyles = transition.in ? parseStyles(transition.in) : { opacity: '1' };

    // Set container to relative positioning to allow absolute positioning of pages
    const containerStyle = (container as HTMLElement).style;
    const originalPosition = containerStyle.position;
    containerStyle.position = 'relative';

    // Style old element for transition
    oldElement.style.position = 'absolute';
    oldElement.style.top = '0';
    oldElement.style.left = '0';
    oldElement.style.width = '100%';
    oldElement.style.transition = `all ${outDuration}ms ease-in-out`;

    // Style new element with initial state
    newElement.style.position = 'absolute';
    newElement.style.top = '0';
    newElement.style.left = '0';
    newElement.style.width = '100%';
    Object.assign(newElement.style, inStartStyles);
    newElement.style.transition = `all ${inDuration}ms ease-in-out`;

    // Add new element to container
    container.appendChild(newElement);

    // Force browser to calculate styles
    void newElement.offsetHeight;

    if (mode === 'simultaneous') {
      // Start both transitions at once
      Object.assign(oldElement.style, outStyles);
      Object.assign(newElement.style, inEndStyles);
      
      // Wait for both transitions to complete
      await new Promise(resolve => setTimeout(resolve, Math.max(outDuration, inDuration)));
    } else {
      // Sequential: transition out old, then transition in new
      Object.assign(oldElement.style, outStyles);
      await new Promise(resolve => setTimeout(resolve, outDuration));
      
      Object.assign(newElement.style, inEndStyles);
      await new Promise(resolve => setTimeout(resolve, inDuration));
    }

    // Cleanup
    oldElement.remove();
    newElement.style.position = '';
    newElement.style.top = '';
    newElement.style.left = '';
    newElement.style.width = '';
    newElement.style.transition = '';
    // Reset any transition styles
    Object.keys({...inStartStyles, ...inEndStyles}).forEach(prop => {
      newElement.style[prop as any] = '';
    });
    containerStyle.position = originalPosition;
  }

  return { page, initialize, navigate, register };
}