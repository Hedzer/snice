/**
 * @render and @styles decorators for Snice v3.0.0
 * Provides automatic differential rendering on property changes
 */

import { TemplateResult, CSSResult, isTemplateResult, isCSSResult } from './template';
import { TemplateInstance } from './parts';
import { RENDER_METHOD, RENDER_OPTIONS, RENDER_INSTANCE, RENDER_TIMERS, RENDER_CALLBACKS, STYLES_METHOD, STYLES_APPLIED, PARENT_STYLES_METHODS, PENDING_RECONNECT_RENDER, RENDER_DEPTH, RENDERED_PROMISE, RENDERED_RESOLVE } from './symbols';
import { ensureRenderRoot } from './render-root';
import { hydrate } from './hydrate';

/**
 * When true, render errors are rethrown instead of logged, so tests and dev
 * environments fail loudly rather than leaving the element silently stale.
 * Production default is false (log and keep the previous DOM).
 */
let strictRenderErrors = false;

export function setStrictRenderErrors(value: boolean): void {
  strictRenderErrors = value;
}

/**
 * Ensure the element has a pending `rendered` promise. Called whenever a
 * render is requested; resolved by performRender once the render commits.
 */
function ensureRenderedPromise(element: HTMLElement): void {
  if (!(element as any)[RENDERED_RESOLVE]) {
    (element as any)[RENDERED_PROMISE] = new Promise<void>((resolve) => {
      (element as any)[RENDERED_RESOLVE] = resolve;
    });
  }
}

/** Resolve the element's pending `rendered` promise, if any. */
function resolveRendered(element: HTMLElement): void {
  const resolve = (element as any)[RENDERED_RESOLVE];
  if (resolve) {
    (element as any)[RENDERED_RESOLVE] = null;
    resolve();
  }
}

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
   * The render method must return a plain HTML string
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
      // Skip elements that were disconnected between scheduling and flush, but
      // remember the dropped render so reconnect can replay it — otherwise the
      // shadow DOM stays stale for a property changed while detached. The flag
      // lives on the element, so it's GC'd with it (no leak if never reattached).
      if (!element.isConnected) {
        (element as any)[PENDING_RECONNECT_RENDER] = true;
        continue;
      }
      const options = (element as any)[RENDER_OPTIONS] || {};
      performRender(element, options);
    }
  }

  /** Remove a disconnected element from the queue */
  remove(element: HTMLElement): void {
    this.pending.delete(element);
  }
}

const renderScheduler = new RenderScheduler();

function hasRendered(element: HTMLElement): boolean {
  return Object.prototype.hasOwnProperty.call(element, RENDER_INSTANCE);
}

function flushRenderCallbacks(element: HTMLElement): void {
  const callbacks = (element as any)[RENDER_CALLBACKS];
  if (!callbacks || callbacks.length === 0) return;
  const cbs = [...callbacks];
  (element as any)[RENDER_CALLBACKS] = [];
  cbs.forEach(cb => cb());
}

/**
 * Backstop against a render() that mutates an observed property, which makes
 * the property setter request another render from inside the current one. In
 * `sync` mode that re-enters performRender synchronously and, unchecked,
 * recurses to a stack overflow. The counter caps synchronous nesting and turns
 * a silent crash into an actionable error. Normal renders never nest (child
 * renders defer to a microtask), so this stays at depth 1 in the common case.
 *
 * The depth is tracked PER ELEMENT (on RENDER_DEPTH), not globally: a runaway
 * component must not consume a shared budget and reject an unrelated component
 * that happens to render inside its call stack.
 */
const MAX_RENDER_DEPTH = 50;

/**
 * Perform the actual render of an element
 */
function performRender(
  element: HTMLElement,
  options: RenderOptions,
  precomputedResult?: any
): void {
  const hasPrecomputedResult = arguments.length >= 3;
  const renderMethod = (element as any)[RENDER_METHOD];
  if (!renderMethod) {
    resolveRendered(element);
    return;
  }

  // If once is true and we've already rendered, skip
  if (options.once && hasRendered(element)) {
    resolveRendered(element);
    return;
  }

  const depth = ((element as any)[RENDER_DEPTH] ?? 0) as number;
  if (depth >= MAX_RENDER_DEPTH) {
    const tag = element.tagName ? element.tagName.toLowerCase() : 'element';
    console.error(
      `snice: maximum render depth (${MAX_RENDER_DEPTH}) exceeded for <${tag}>. ` +
      `render() is mutating an observed property, causing an infinite render loop.`
    );
    resolveRendered(element);
    return;
  }

  (element as any)[RENDER_DEPTH] = depth + 1;
  try {
    const result = hasPrecomputedResult
      ? precomputedResult
      : renderMethod.call(element);

    const renderRoot = ensureRenderRoot(element);

    // Non-differential rendering (string)
    if (options.differential === false) {
      if (typeof result !== 'string') {
        console.warn('Render method with differential: false must return a string');
        return;
      }
      const template = document.createElement('template');
      template.innerHTML = result;
      const instance = (element as any)[RENDER_INSTANCE] as TemplateInstance | null | undefined;
      instance?.clear();
      const removable = Array.from(renderRoot.childNodes).filter(node => !(
        node.nodeType === Node.ELEMENT_NODE &&
        (node as Element).tagName === 'STYLE' &&
        (node as Element).hasAttribute('data-snice-style')
      ));
      for (const node of removable) node.remove();
      renderRoot.appendChild(template.content);
      // A present, null render instance records a successful string render so
      // `once` works without pretending the string tree is a TemplateInstance.
      (element as any)[RENDER_INSTANCE] = null;
      flushRenderCallbacks(element);
      return;
    }

    // Differential rendering (template)
    if (!isTemplateResult(result)) {
      console.warn('Render method must return html`` template result');
      return;
    }

    let instance = (element as any)[RENDER_INSTANCE] as TemplateInstance | undefined;

    if (!instance && element.hasAttribute('data-snice-hydrate')) {
      try {
        instance = hydrate(result, renderRoot);
        (element as any)[RENDER_INSTANCE] = instance;
        element.removeAttribute('data-snice-hydrate');
        flushRenderCallbacks(element);
        return;
      } catch (error) {
        element.removeAttribute('data-snice-hydrate');
        if (strictRenderErrors) throw error;
        console.error('Error hydrating element; rendering a fresh tree:', error);
      }
    }

    if (instance && instance.isSameTemplate(result.strings)) {
      instance.update(result.values);
      flushRenderCallbacks(element);
      return;
    }

    const nextInstance = new TemplateInstance(result);
    const nextFragment = nextInstance.renderFragment();

    // Commit while detached first. A malformed binding or directive can then
    // fail without exposing a half-updated tree. Connection-aware directives
    // are paired with reconnected() immediately after the successful mount.
    try {
      nextInstance.update(result.values);
    } catch (error) {
      nextInstance.clear();
      throw error;
    }

    // Park the previous tree without disposing it, mount the prepared tree,
    // then run connection hooks. A ref/action/portal/custom directive can fail
    // only once it is connected; in that case restore the still-live previous
    // tree instead of leaving a partially mounted replacement behind.
    const previousFragment = document.createDocumentFragment();
    for (const child of Array.from(renderRoot.childNodes)) {
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        (child as Element).tagName === 'STYLE' &&
        (child as Element).hasAttribute('data-snice-style')
      ) continue;
      previousFragment.appendChild(child);
    }
    renderRoot.appendChild(nextFragment);
    try {
      if (element.isConnected) nextInstance.reconnected();
    } catch (error) {
      try {
        nextInstance.clear();
      } catch (cleanupError) {
        console.error('snice: failed to clean up a rejected render tree:', cleanupError);
      }
      for (const child of Array.from(renderRoot.childNodes)) {
        if (
          child.nodeType === Node.ELEMENT_NODE &&
          (child as Element).tagName === 'STYLE' &&
          (child as Element).hasAttribute('data-snice-style')
        ) continue;
        child.remove();
      }
      renderRoot.appendChild(previousFragment);
      throw error;
    }

    (element as any)[RENDER_INSTANCE] = nextInstance;
    let cleanupError: unknown;
    try {
      instance?.clear();
    } catch (error) {
      cleanupError = error;
    }
    flushRenderCallbacks(element);
    if (cleanupError) throw cleanupError;
  } catch (error) {
    if (strictRenderErrors) throw error;
    console.error('Error rendering element:', error);
  } finally {
    (element as any)[RENDER_DEPTH] = depth;
    resolveRendered(element);
  }
}

/** Commit immediately using the element's configured render options. */
export function renderElementNow(element: HTMLElement): void {
  ensureRenderedPromise(element);
  const options = (element as any)[RENDER_OPTIONS] as RenderOptions || {};
  performRender(element, { ...options, once: false });
}

/**
 * Request a render for an element
 * Respects debounce/throttle/once/sync options
 * @param immediate - Force immediate render (used for initial render)
 */
export function requestRender(element: HTMLElement, immediate = false): void {
  const options = (element as any)[RENDER_OPTIONS] as RenderOptions || {};

  // Handle once option
  if (options.once && hasRendered(element)) {
    if (element.isConnected) reconnectRenderTree(element);
    return;
  }

  // Arm the `rendered` promise: it resolves when this request's render
  // commits (immediately below for sync/immediate, later for batched/
  // debounced/throttled renders).
  ensureRenderedPromise(element);

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
      (element as any)[RENDER_TIMERS].debounce = null;
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
 * Clear any pending debounce/throttle render timers on an element (e.g. on
 * disconnect, so they don't fire on a dead element and retain it until they
 * expire). Returns true if a render was actually pending, so the caller can
 * arrange a replay on reconnect via PENDING_RECONNECT_RENDER.
 */
export function clearRenderTimers(element: HTMLElement): boolean {
  const timers = (element as any)[RENDER_TIMERS];
  if (!timers) return false;

  let hadPending = false;
  if (timers.debounce) {
    clearTimeout(timers.debounce);
    timers.debounce = null;
    hadPending = true;
  }
  if (timers.throttleTimer) {
    clearTimeout(timers.throttleTimer);
    timers.throttleTimer = null;
    hadPending = true;
  }
  // Deliberately do NOT reset timers.lastThrottle: a plain DOM move is a
  // disconnect+reconnect, and zeroing the cooldown would let the next render
  // fire inside the throttle window. Preserving it keeps throttle honest
  // across moves; on a true disconnect the element is discarded anyway.
  return hadPending;
}

/** Pause directive-owned resources while an element is detached. */
export function disconnectRenderTree(element: HTMLElement): void {
  const instance = (element as any)[RENDER_INSTANCE] as TemplateInstance | undefined;
  // A host disconnection is not the same thing as parking a conditional
  // branch. The shadow/light render tree still belongs to the host, so native
  // event listeners remain usable on retained node references. Directive-owned
  // resources are still paused, and parked branches continue to detach their
  // listeners through the ordinary Part lifecycle.
  instance?.disconnected(true);
}

/** Resume directive-owned resources when an existing render tree reconnects. */
export function reconnectRenderTree(element: HTMLElement): void {
  const instance = (element as any)[RENDER_INSTANCE] as TemplateInstance | undefined;
  instance?.reconnected();
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
      const configured = (this as any)[RENDER_OPTIONS] || options;
      performRender(this, { ...configured, once: false }, result);

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
      // Collect parent styles methods before overwriting with child's
      if (this[STYLES_METHOD] && !this[PARENT_STYLES_METHODS]) {
        this[PARENT_STYLES_METHODS] = [this[STYLES_METHOD]];
      } else if (this[STYLES_METHOD] && this[PARENT_STYLES_METHODS]) {
        this[PARENT_STYLES_METHODS].push(this[STYLES_METHOD]);
      }
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
  const staticResults: CSSResult[] = [];
  const constructors: any[] = [];
  let constructor: any = element.constructor;
  while (constructor && constructor !== HTMLElement && constructor !== Function.prototype) {
    constructors.unshift(constructor);
    constructor = Object.getPrototypeOf(constructor);
  }
  for (const current of constructors) {
    if (!Object.prototype.hasOwnProperty.call(current, 'styles')) continue;
    const value = current.styles;
    const values = Array.isArray(value) ? value : [value];
    for (const result of values) {
      if (isCSSResult(result)) staticResults.push(result);
      else console.warn('Static styles must be a css`` result or an array of css`` results');
    }
  }
  if (!stylesMethod && staticResults.length === 0) return;

  // Only apply once
  if ((element as any)[STYLES_APPLIED]) return;
  (element as any)[STYLES_APPLIED] = true;

  try {
    // Collect all CSS results: parent styles first, then child styles
    const allResults: CSSResult[] = [...staticResults];
    const parentMethods = (element as any)[PARENT_STYLES_METHODS] as Array<(...args: any[]) => any> | undefined;
    if (parentMethods) {
      for (const method of parentMethods) {
        const r = method.call(element);
        if (isCSSResult(r)) allResults.push(r);
      }
    }
    if (stylesMethod) {
      const result = stylesMethod.call(element);
      if (!isCSSResult(result)) {
        console.warn('Styles method must return css`` template result');
        return;
      }
      allResults.push(result);
    }

    const renderRoot = ensureRenderRoot(element);

    // A declarative-shadow-DOM response may already contain exactly these
    // framework styles. Retain them instead of adding a duplicate stylesheet
    // before hydration begins.
    const serverStyles = Array.from(renderRoot.childNodes).filter(node =>
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName === 'STYLE' &&
      (node as Element).hasAttribute('data-snice-style')
    ) as HTMLStyleElement[];
    if (
      serverStyles.length === allResults.length &&
      serverStyles.every((style, index) => style.textContent === allResults[index].cssText)
    ) {
      return;
    }
    for (const style of serverStyles) style.remove();

    // Prefer constructable stylesheets
    if (renderRoot instanceof ShadowRoot && allResults.every(r => !!r.styleSheet) && 'adoptedStyleSheets' in renderRoot) {
      try {
        renderRoot.adoptedStyleSheets = allResults.map(r => r.styleSheet!);
        return;
      } catch {
        // A stylesheet constructed in another Window/Document realm cannot be
        // adopted here. Fall through to equivalent <style> elements.
      }
    }

    // Fallback — one <style> tag per stylesheet, preserving cascade order.
    // Marked so the template-switch cleanup keeps these (framework styles) but
    // still removes template-emitted <style> tags (which would otherwise pile up).
    for (const r of allResults) {
      const style = document.createElement('style');
      style.setAttribute('data-snice-style', '');
      style.textContent = r.cssText;
      renderRoot.appendChild(style);
    }
  } catch (error) {
    console.error('Error applying styles:', error);
  }
}
