import { element, property, ready, dispose, render, styles, html, css } from 'snice';
import { getSymbol } from '../symbols';
import type { ToastPosition, ToastOptions, ToastEventDetail, ToastResponseEventDetail, SniceToastContainerElement } from './snice-toast.types';
import './snice-toast';

// Symbols for global state management
const TOAST_CONTAINER = getSymbol('@snice/toast', 'container');
const TOAST_LISTENER_INITIALIZED = getSymbol('@snice/toast', 'listener-initialized');

// Namespaced events
const TOAST_EVENT_SHOW = 'show-toast';
const TOAST_EVENT_RESPONSE = 'toast-response';

@element('snice-toast-container')
export class SniceToastContainer extends HTMLElement implements SniceToastContainerElement {
  @property({  })
  position: ToastPosition = 'bottom-center';

  private toastIdCounter = 1;
  private toasts: Map<string, HTMLElement> = new Map();
  private originParent: Element | null = null;
  private contextObserver: MutationObserver | null = null;
  private inheritedPlatform = false;
  private inheritedTheme = false;

  @render()
  render() {
    return html/*html*/`
      <div part="base" class="toast-wrapper"></div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`
      :host([hidden]) {
  display: none;
}

:host {
        position: fixed;
        z-index: 10000;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
      }

      /* Position variants */
      :host([position="top-left"]) {
        top: 0;
        left: 0;
        align-items: flex-start;
      }

      :host([position="top-center"]) {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        align-items: center;
      }

      :host([position="top-right"]) {
        top: 0;
        right: 0;
        align-items: flex-end;
      }

      :host([position="bottom-left"]) {
        bottom: 0;
        left: 0;
        align-items: flex-start;
      }

      :host([position="bottom-center"]) {
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        align-items: center;
      }

      :host([position="bottom-right"]) {
        bottom: 0;
        right: 0;
        align-items: flex-end;
      }

      .toast-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    `;
  }

  @ready()
  init() {
    // Hoist to document.body so z-index isn't trapped by parent stacking contexts,
    // while preserving any scoped data-platform / data-theme ancestor context.
    if (this.parentElement && this.parentElement !== document.body) {
      if (!this.originParent) {
        this.originParent = this.parentElement;
      }
      document.body.appendChild(this);
    }

    this.observeOriginContext();
    this.syncOriginContext();

    // Register as global container if none exists
    if (!(globalThis as any)[TOAST_CONTAINER]) {
      (globalThis as any)[TOAST_CONTAINER] = this;
    }
    // Initialize event listener if not already done
    initializeGlobalEventListener();
  }

  @dispose()
  cleanup() {
    this.contextObserver?.disconnect();
    this.contextObserver = null;

    // Unregister as global container
    if ((globalThis as any)[TOAST_CONTAINER] === this) {
      (globalThis as any)[TOAST_CONTAINER] = null;
    }
    
    // Clean up all toasts
    this.toasts.clear();
  }

  private observeOriginContext(): void {
    this.contextObserver?.disconnect();
    this.contextObserver = null;
    if (!this.originParent || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => this.syncOriginContext());
    let cur: Element | null = this.originParent;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      observer.observe(cur, { attributes: true, attributeFilter: ['data-platform', 'data-theme'] });
      cur = cur.parentElement;
    }
    this.contextObserver = observer;
  }

  private syncOriginContext(): void {
    if (!this.originParent) return;
    const platformHost = this.originParent.closest('[data-platform]');
    const scopedPlatform = platformHost && platformHost !== document.documentElement && platformHost !== document.body
      ? platformHost.getAttribute('data-platform')
      : null;

    if (!this.hasAttribute('data-platform') || this.inheritedPlatform) {
      if (scopedPlatform) {
        if (this.getAttribute('data-platform') !== scopedPlatform) {
          this.setAttribute('data-platform', scopedPlatform);
        }
        this.inheritedPlatform = true;
      } else if (this.inheritedPlatform) {
        this.removeAttribute('data-platform');
        this.inheritedPlatform = false;
      }
    }

    const themeHost = this.originParent.closest('[data-theme]');
    const scopedTheme = themeHost && themeHost !== document.documentElement && themeHost !== document.body
      ? themeHost.getAttribute('data-theme')
      : null;

    if (!this.hasAttribute('data-theme') || this.inheritedTheme) {
      if (scopedTheme) {
        if (this.getAttribute('data-theme') !== scopedTheme) {
          this.setAttribute('data-theme', scopedTheme);
        }
        this.inheritedTheme = true;
      } else if (this.inheritedTheme) {
        this.removeAttribute('data-theme');
        this.inheritedTheme = false;
      }
    }
  }

  show(message: string, options: ToastOptions = {}): string {
    this.syncOriginContext();
    const id = options.id || `toast-${this.toastIdCounter++}`;
    const type = options.type || 'info';
    const duration = options.duration !== undefined ? options.duration : 4000;
    const closable = options.closable !== undefined ? options.closable : true;
    const icon = options.icon !== undefined ? options.icon : true;

    // Create toast element
    const toast = document.createElement('snice-toast') as any;
    toast.setAttribute('toast-id', id);
    toast.setAttribute('part', 'toast');
    toast.setAttribute('exportparts', 'base: toast-base, icon: toast-icon, icon-info: toast-icon-info, icon-success: toast-icon-success, icon-warning: toast-icon-warning, icon-error: toast-icon-error, content: toast-content, close-button: toast-close-button');
    toast.type = type;
    toast.message = message;
    toast.closable = closable;
    toast.icon = icon;

    // Add to container
    const wrapper = this.shadowRoot?.querySelector('.toast-wrapper');
    if (wrapper) {
      // Add based on position (top positions prepend, bottom positions append)
      if (this.position.startsWith('bottom')) {
        wrapper.appendChild(toast);
      } else {
        wrapper.insertBefore(toast, wrapper.firstChild);
      }
    }

    // Store reference
    this.toasts.set(id, toast);

    // Set auto-dismiss timer if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    // Listen for close event from toast
    toast.addEventListener('close-toast', () => {
      this.hide(id);
    });

    return id;
  }

  hide(id: string): void {
    const toast = this.toasts.get(id);
    if (!toast) return;

    // Trigger hide animation on toast
    (toast as any).hide();
    
    // Remove after animation completes
    toast.addEventListener('animationend', () => {
      toast.remove();
      this.toasts.delete(id);
    }, { once: true });
  }

  clear(): void {
    this.toasts.forEach((_, id) => this.hide(id));
  }
}

// Static Toast API
export class Toast {
  private static ensureContainer(position: ToastPosition = 'bottom-center'): SniceToastContainer {
    // Use existing global container if available
    const globalContainer = (globalThis as any)[TOAST_CONTAINER] as SniceToastContainer;
    if (globalContainer) {
      // Update position if different
      if (globalContainer.position !== position) {
        globalContainer.position = position;
      }
      return globalContainer;
    }

    // Create new container
    const container = document.createElement('snice-toast-container') as SniceToastContainer;
    // Author the reflected state before connection. A pre-connect property
    // assignment is queued until @property initialization completes and does
    // not create the attribute consumed by the host positioning selectors.
    container.setAttribute('position', position);
    document.body.appendChild(container);
    // Claim the global slot NOW, not at @ready: a burst of awaited `show()`
    // calls before the first container becomes ready would otherwise each
    // build their own container and their own id counter.
    (globalThis as any)[TOAST_CONTAINER] = container;
    return container;
  }

  static async show(message: string, options: ToastOptions = {}): Promise<string> {
    const container = Toast.ensureContainer(options.position);
    await (container as any).ready;
    return container.show(message, options);
  }

  static async success(message: string, options: ToastOptions = {}): Promise<string> {
    return Toast.show(message, { ...options, type: 'success' });
  }

  static async error(message: string, options: ToastOptions = {}): Promise<string> {
    return Toast.show(message, { ...options, type: 'error' });
  }

  static async warning(message: string, options: ToastOptions = {}): Promise<string> {
    return Toast.show(message, { ...options, type: 'warning' });
  }

  static async info(message: string, options: ToastOptions = {}): Promise<string> {
    return Toast.show(message, { ...options, type: 'info' });
  }

  static hide(id: string): void {
    const globalContainer = (globalThis as any)[TOAST_CONTAINER] as SniceToastContainer;
    if (globalContainer) {
      globalContainer.hide(id);
    }
  }

  static clear(): void {
    const globalContainer = (globalThis as any)[TOAST_CONTAINER] as SniceToastContainer;
    if (globalContainer) {
      globalContainer.clear();
    }
  }
}

// Global event listener for toast events
function initializeGlobalEventListener() {
  if ((globalThis as any)[TOAST_LISTENER_INITIALIZED]) return;

  document.documentElement.addEventListener(TOAST_EVENT_SHOW, async (event: Event) => {
    const customEvent = event as CustomEvent<ToastEventDetail>;
    const { message, options = {} } = customEvent.detail;

    // Show the toast
    const toastId = await Toast.show(message, options);

    // Dispatch response event with toast ID if the original event requested it
    if (customEvent.detail.options?.id) {
      const responseEvent = new CustomEvent<ToastResponseEventDetail>(TOAST_EVENT_RESPONSE, {
        detail: { toastId },
        bubbles: true,
        composed: true
      });
      (customEvent.target as HTMLElement)?.dispatchEvent(responseEvent);
    }
  });

  (globalThis as any)[TOAST_LISTENER_INITIALIZED] = true;
}

// Initialize listener on module load
initializeGlobalEventListener();

// Export for convenience
export default Toast;
