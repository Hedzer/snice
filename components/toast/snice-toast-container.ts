import { element, property, ready, dispose } from 'snice';
import { getSymbol } from '../symbols';
import type { ToastPosition, ToastOptions, ToastEventDetail, ToastResponseEventDetail, SniceToastContainerElement } from './snice-toast.types';
import './snice-toast';

// Symbols for global state management
const TOAST_CONTAINER = getSymbol('@snice/toast', 'container');
const TOAST_LISTENER_INITIALIZED = getSymbol('@snice/toast', 'listener-initialized');

// Namespaced events
const TOAST_EVENT_SHOW = '@snice/show-toast';
const TOAST_EVENT_RESPONSE = '@snice/toast-response';

@element('snice-toast-container')
export class SniceToastContainer extends HTMLElement implements SniceToastContainerElement {
  @property({  })
  position: ToastPosition = 'bottom-center';

  private toastIdCounter = 1;
  private toasts: Map<string, HTMLElement> = new Map();

  html() {
    return /*html*/`
      <div class="toast-wrapper"></div>
    `;
  }

  css() {
    return /*css*/`
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
    // Register as global container if none exists
    if (!(globalThis as any)[TOAST_CONTAINER]) {
      (globalThis as any)[TOAST_CONTAINER] = this;
    }
    // Initialize event listener if not already done
    initializeGlobalEventListener();
  }

  @dispose()
  cleanup() {
    // Unregister as global container
    if ((globalThis as any)[TOAST_CONTAINER] === this) {
      (globalThis as any)[TOAST_CONTAINER] = null;
    }
    
    // Clean up all toasts
    this.toasts.clear();
  }

  show(message: string, options: ToastOptions = {}): string {
    const id = options.id || `toast-${this.toastIdCounter++}`;
    const type = options.type || 'info';
    const duration = options.duration !== undefined ? options.duration : 4000;
    const closable = options.closable !== undefined ? options.closable : true;
    const icon = options.icon !== undefined ? options.icon : true;

    // Create toast element
    const toast = document.createElement('snice-toast') as any;
    toast.setAttribute('toast-id', id);
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
    container.position = position;
    document.body.appendChild(container);
    return container;
  }

  static show(message: string, options: ToastOptions = {}): string {
    const container = Toast.ensureContainer(options.position);
    return container.show(message, options);
  }

  static success(message: string, options: ToastOptions = {}): string {
    return Toast.show(message, { ...options, type: 'success' });
  }

  static error(message: string, options: ToastOptions = {}): string {
    return Toast.show(message, { ...options, type: 'error' });
  }

  static warning(message: string, options: ToastOptions = {}): string {
    return Toast.show(message, { ...options, type: 'warning' });
  }

  static info(message: string, options: ToastOptions = {}): string {
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
  
  document.documentElement.addEventListener(TOAST_EVENT_SHOW, (event: Event) => {
    const customEvent = event as CustomEvent<ToastEventDetail>;
    const { message, options = {} } = customEvent.detail;
    
    // Show the toast
    const toastId = Toast.show(message, options);
    
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