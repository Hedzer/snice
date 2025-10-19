import { element, property, query, on, watch, dispatch } from 'snice';
import type { ToastType, SniceToastElement } from './snice-toast.types';

@element('snice-toast')
export class SniceToast extends HTMLElement implements SniceToastElement {
  @property({  })
  type: ToastType = 'info';

  @property({  })
  message: string = '';

  @property({ type: Boolean,  })
  closable: boolean = true;

  @property({ type: Boolean,  })
  icon: boolean = true;

  @query('.toast')
  toastElement?: HTMLElement;

  @query('.toast-icon')
  iconElement?: HTMLElement;

  @query('.toast-content')
  contentElement?: HTMLElement;

  @query('.toast-close')
  closeButton?: HTMLElement;

  html() {
    return /*html*/`
      <div class="toast toast--${this.type}" role="alert" aria-live="polite">
        <span class="toast-icon">${this.getIcon(this.type)}</span>
        <span class="toast-content">${this.message}</span>
        <button class="toast-close" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"/>
          </svg>
        </button>
      </div>
    `;
  }

  css() {
    return /*css*/`
      :host {
        pointer-events: auto;
        display: block;
        animation: slideIn 0.3s ease-out;
      }

      .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 200px;
        max-width: 320px;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        transition: all 0.3s ease;
      }

      .toast--success {
        background-color: #10b981;
        color: white;
      }

      .toast--error {
        background-color: #ef4444;
        color: white;
      }

      .toast--warning {
        background-color: #f59e0b;
        color: white;
      }

      .toast--info {
        background-color: #3b82f6;
        color: white;
      }

      .toast-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast-icon[hidden] {
        display: none;
      }

      .toast-icon svg {
        width: 100%;
        height: 100%;
        fill: currentColor;
      }

      .toast-content {
        flex: 1;
        word-wrap: break-word;
      }

      .toast-close {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        background: none;
        border: none;
        color: inherit;
        padding: 0;
      }

      .toast-close[hidden] {
        display: none;
      }

      .toast-close:hover {
        opacity: 1;
      }

      /* Animations */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      :host(.hiding) {
        animation: slideOut 0.3s ease-out;
      }

      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(100%);
        }
      }

      /* For top-positioned container - slide down */
      :host-context(snice-toast-container[position^="top"]) {
        animation: slideInTop 0.3s ease-out;
      }

      :host-context(snice-toast-container[position^="top"]):host(.hiding) {
        animation: slideOutTop 0.3s ease-out;
      }

      @keyframes slideInTop {
        from {
          opacity: 0;
          transform: translateY(-100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideOutTop {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-100%);
        }
      }

      [hidden] {
        display: none !important;
      }
    `;
  }

  // Helper function to hide/show elements
  private setHidden(selector: string, hide: boolean): void {
    const element = this.shadowRoot?.querySelector(selector) as HTMLElement;
    if (element) {
      if (hide) {
        element.setAttribute('hidden', '');
      } else {
        element.removeAttribute('hidden');
      }
    }
  }

  @watch('type')
  updateType() {
    if (this.toastElement) {
      // Remove old type class
      this.toastElement.className = this.toastElement.className.replace(/toast--\w+/, '');
      // Add new type class
      this.toastElement.classList.add(`toast--${this.type}`);
    }
    // Update icon
    if (this.iconElement) {
      this.iconElement.innerHTML = this.getIcon(this.type);
    }
  }

  @watch('message')
  updateMessage() {
    if (this.contentElement) {
      this.contentElement.textContent = this.message;
    }
  }

  @watch('closable')
  updateClosable() {
    this.setHidden('.toast-close', !this.closable);
  }

  @watch('icon')
  updateIcon() {
    this.setHidden('.toast-icon', !this.icon);
  }

  @on('click')
  handleClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.toast-close')) return;

    this.dispatchCloseEvent();
  }

  @dispatch('close-toast')
  private dispatchCloseEvent() {
    return { id: this.getAttribute('toast-id') };
  }

  hide() {
    this.classList.add('hiding');
  }

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return `<svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>`;
      
      case 'error':
        return `<svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM10 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
        </svg>`;
      
      case 'warning':
        return `<svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`;
      
      case 'info':
      default:
        return `<svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>`;
    }
  }
}