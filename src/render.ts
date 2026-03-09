/**
 * @render and @styles decorators for Snice v3.0.0
 * Provides automatic differential rendering on property changes
 */

import { TemplateResult, CSSResult, isTemplateResult, isCSSResult } from './template';
import { TemplateInstance } from './parts';
import { RENDER_METHOD, RENDER_OPTIONS, RENDER_INSTANCE, RENDER_TIMERS, RENDER_CALLBACKS, STYLES_METHOD, STYLES_APPLIED } from './symbols';

/**
 * Options for @render decorator
 */
export interface RenderOptions {
  /**
   * Debounce render calls (ms)
   * Delays rendering until after this many ms of inactivity
   */
  debounce?: number;

  /**
   * Throttle render calls (ms)
   * Limits rendering to once per this many ms
   */
  throttle?: number;

  /**
   * Render only once, disable auto-rendering
   * Component must call render() method manually to re-render
   */
  once?: boolean;

  /**
   * Synchronous rendering (skip microtask batching)
   * Renders immediately instead of batching multiple property changes
   */
  sync?: boolean;

  /**
   * Disable differential rendering
   * When false, clears shadow root and re-renders from scratch each time
   * Still honors <if> and <switch>/<case> meta elements
   */
  differential?: boolean;
}

/**
 * Global render scheduler for microtask batching
 * Batches multiple property changes into a single render
 */
class RenderScheduler {
  private pending = new Set<HTMLElement>();
  private scheduled = false;

  /**
   * Schedule an element for rendering
   * Batches renders in a microtask unless sync option is enabled
   */
  schedule(element: HTMLElement, options: RenderOptions): void {
    // Sync rendering - execute immediately
    if (options.sync) {
      performRender(element, options);
      return;
    }

    // Async rendering - batch in microtask
    this.pending.add(element);

    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  /**
   * Flush all pending renders
   */
  private flush(): void {
    const elements = Array.from(this.pending);
    this.pending.clear();
    this.scheduled = false;

    for (const element of elements) {
      const options = (element as any)[RENDER_OPTIONS] || {};
      performRender(element, options);
    }
  }
}

const renderScheduler = new RenderScheduler();

function flushRenderCallbacks(element: HTMLElement): void {
  const callbacks = (element as any)[RENDER_CALLBACKS];
  if (!callbacks || callbacks.length === 0) return;
  const cbs = [...callbacks];
  (element as any)[RENDER_CALLBACKS] = [];
  cbs.forEach(cb => cb());
}

/**
 * Perform the actual render of an element
 */
function performRender(element: HTMLElement, options: RenderOptions, precomputedResult?: any): void {
  const renderMethod = (element as any)[RENDER_METHOD];
  if (!renderMethod) return;

  // If once is true and we've already rendered, skip
  if (options.once && (element as any)[RENDER_INSTANCE]) {
    return;
  }

  try {
    const result = precomputedResult !== undefined ? precomputedResult : renderMethod.call(element);

    if (!element.shadowRoot) element.attachShadow({ mode: 'open' });

    // Non-differential rendering (string)
    if (options.differential === false) {
      if (typeof result !== 'string') {
        console.warn('Render method with differential: false must return a string');
        return;
      }
      element.shadowRoot!.innerHTML = result;
      flushRenderCallbacks(element);
      return;
    }

    // Differential rendering (template)
    if (!isTemplateResult(result)) {
      console.warn('Render method must return html`` template result');
      return;
    }

    let instance = (element as any)[RENDER_INSTANCE] as TemplateInstance | undefined;

    if (instance && instance.isSameTemplate(result.strings)) {
      instance.update(result.values);
      flushRenderCallbacks(element);
      return;
    }

    // Different template or first render
    if (instance) element.shadowRoot!.innerHTML = '';

    instance = new TemplateInstance(result);
    (element as any)[RENDER_INSTANCE] = instance;
    element.shadowRoot!.appendChild(instance.renderFragment());
    instance.update(result.values);
    flushRenderCallbacks(element);
  } catch (error) {
    console.error('Error rendering element:', error);
  }
}

/**
 * Request a render for an element
 * Respects debounce/throttle/once/sync options
 * @param immediate - Force immediate render (used for initial render)
 */
export function requestRender(element: HTMLElement, immediate = false): void {
  const options = (element as any)[RENDER_OPTIONS] as RenderOptions || {};

  // Handle once option
  if (options.once && (element as any)[RENDER_INSTANCE]) {
    return;
  }

  // Force immediate render (for initial render)
  if (immediate) {
    performRender(element, options);
    return;
  }

  // Handle debounce
  if (options.debounce !== undefined && options.debounce > 0) {
    if (!(element as any)[RENDER_TIMERS]) {
      (element as any)[RENDER_TIMERS] = {};
    }

    clearTimeout((element as any)[RENDER_TIMERS].debounce);
    (element as any)[RENDER_TIMERS].debounce = setTimeout(() => {
      renderScheduler.schedule(element, options);
    }, options.debounce);
    return;
  }

  // Handle throttle
  if (options.throttle !== undefined && options.throttle > 0) {
    if (!(element as any)[RENDER_TIMERS]) {
      (element as any)[RENDER_TIMERS] = { lastThrottle: 0 };
    }

    const timers = (element as any)[RENDER_TIMERS];
    const now = Date.now();

    if (timers.lastThrottle === 0 || now - timers.lastThrottle >= options.throttle) {
      timers.lastThrottle = now;
      renderScheduler.schedule(element, options);
      return;
    }

    if (!timers.throttleTimer) {
      const remaining = options.throttle - (now - timers.lastThrottle);
      timers.throttleTimer = setTimeout(() => {
        timers.throttleTimer = null;
        timers.lastThrottle = Date.now();
        renderScheduler.schedule(element, options);
      }, remaining);
    }
    return;
  }

  // Normal rendering (with microtask batching unless sync)
  renderScheduler.schedule(element, options);
}

/**
 * @render decorator for component rendering
 *
 * Marks a method as the render method for the component.
 * The method should return html`...` template.
 * Automatically re-renders when properties change (unless once: true).
 *
 * @example
 * ```typescript
 * @render()
 * renderContent() {
 *   return html`<div>${this.count}</div>`;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Debounced rendering
 * @render({ debounce: 100 })
 * renderContent() {
 *   return html`<div>${this.searchTerm}</div>`;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Render only once (manual re-renders only)
 * @render({ once: true })
 * renderContent() {
 *   return html`<div>Static content</div>`;
 * }
 * ```
 */
export function render(options: RenderOptions = {}) {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;

    context.addInitializer(function (this: any) {
      // Store the render method and options
      this[RENDER_METHOD] = originalMethod;
      this[RENDER_OPTIONS] = options;
    });

    // Return wrapped method that triggers re-render when called manually
    return function (this: HTMLElement, ...args: any[]) {
      // Call original method to get the template
      const result = originalMethod.apply(this, args);

      // Always render when method is called manually (even if once: true)
      // Force immediate render to bypass all options, pass precomputed result to avoid calling method twice
      performRender(this, {}, result);

      return result;
    };
  };
}

/**
 * @styles decorator for component styles
 *
 * Marks a method as the styles method for the component.
 * The method should return css`...` template.
 * Styles are applied once when the component is connected.
 *
 * @example
 * ```typescript
 * @styles()
 * styles() {
 *   return css`:host { display: block; }`;
 * }
 * ```
 */
export function styles() {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    context.addInitializer(function (this: any) {
      // Store the styles method
      this[STYLES_METHOD] = originalMethod;
    });

    return originalMethod;
  };
}

/**
 * Apply styles to an element
 * Called during element initialization
 */
export function applyStyles(element: HTMLElement): void {
  const stylesMethod = (element as any)[STYLES_METHOD];
  if (!stylesMethod) return;

  // Only apply once
  if ((element as any)[STYLES_APPLIED]) return;
  (element as any)[STYLES_APPLIED] = true;

  try {
    const result = stylesMethod.call(element);

    if (!isCSSResult(result)) {
      console.warn('Styles method must return css`` template result');
      return;
    }

    // Ensure shadow root exists
    if (!element.shadowRoot) {
      element.attachShadow({ mode: 'open' });
    }

    if (!element.shadowRoot) return;

    // Prefer constructable stylesheets
    if (result.styleSheet && 'adoptedStyleSheets' in element.shadowRoot) {
      element.shadowRoot.adoptedStyleSheets = [result.styleSheet];
      return;
    }

    // Fallback to <style> tag
    const style = document.createElement('style');
    style.textContent = result.cssText;
    element.shadowRoot.appendChild(style);
  } catch (error) {
    console.error('Error applying styles:', error);
  }
}
