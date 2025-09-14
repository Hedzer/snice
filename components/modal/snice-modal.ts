import { element, property, query, on, watch, ready, dispatch } from 'snice';
import css from './snice-modal.css?inline';
import type { ModalSize, SniceModalElement } from './snice-modal.types';

@element('snice-modal')
export class SniceModal extends HTMLElement implements SniceModalElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ reflect: true })
  size: ModalSize = 'medium';
  
  private previousSize = 'medium';

  @property({ type: Boolean, attribute: 'no-backdrop-dismiss', reflect: true })
  noBackdropDismiss = false;

  @property({ type: Boolean, attribute: 'no-escape-dismiss', reflect: true })
  noEscapeDismiss = false;

  @property({ type: Boolean, attribute: 'no-focus-trap', reflect: true })
  noFocusTrap = false;

  @property({ type: Boolean, attribute: 'no-close-button', reflect: true })
  noCloseButton = false;

  @property({ reflect: true })
  label = '';

  @query('.modal')
  modal?: HTMLElement;

  @query('.modal__panel')
  panel?: HTMLElement;

  @query('.modal__backdrop')
  backdrop?: HTMLElement;

  private previousFocus: HTMLElement | null = null;

  html() {
    // Renders once - initial state
    return /*html*/`
      <div class="modal" 
           role="dialog" 
           aria-modal="true"
           aria-label="${this.label}"
           aria-hidden="true">
        <div class="modal__backdrop" part="backdrop"></div>
        <div class="modal__panel modal__panel--${this.size}" part="panel">
          <div class="modal__header" part="header">
            <slot name="header"></slot>
            <button class="modal__close" part="close" aria-label="Close modal">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <div class="modal__body" part="body">
            <slot></slot>
          </div>
          <div class="modal__footer" part="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }

  css() {
    return css;
  }

  @ready()
  init() {
    // Make sure modal state is properly initialized
    if (this.open) {
      this.showModal();
    }
    // Apply initial close button state
    if (this.noCloseButton) {
      const closeButton = this.shadowRoot?.querySelector('.modal__close') as HTMLElement;
      if (closeButton) {
        closeButton.style.display = 'none';
      }
    }
  }

  @watch('open')
  handleOpenChange() {
    // Imperatively update the modal DOM
    if (this.modal) {
      if (this.open) {
        this.modal.classList.add('modal--open');
        this.modal.setAttribute('aria-hidden', 'false');
        this.showModal();
      } else {
        this.modal.classList.remove('modal--open');
        this.modal.setAttribute('aria-hidden', 'true');
        this.hideModal();
      }
    }
  }
  
  @watch('size')
  handleSizeChange() {
    // Imperatively update the panel size class
    if (this.panel) {
      this.panel.classList.remove(`modal__panel--${this.previousSize}`);
      this.panel.classList.add(`modal__panel--${this.size}`);
      this.previousSize = this.size;
    }
  }

  @watch('noCloseButton')
  handleCloseButtonChange() {
    // Imperatively show/hide the close button
    const closeButton = this.shadowRoot?.querySelector('.modal__close') as HTMLElement;
    if (closeButton) {
      closeButton.style.display = this.noCloseButton ? 'none' : '';
    }
  }

  @on('click', '.modal__backdrop')
  handleBackdropClick() {
    if (!this.noBackdropDismiss) {
      this.close();
    }
  }

  @on('click', '.modal__close')
  handleCloseClick() {
    this.close();
  }

  @on('keydown:Escape', { stopPropagation: true })
  handleEscape() {
    if (!this.open) return;
    if (!this.noEscapeDismiss) {
      this.close();
    }
  }

  @on('keydown:Tab')
  handleTab(e: KeyboardEvent) {
    if (!this.open) return;
    if (!this.noFocusTrap) {
      this.trapFocus(e);
    }
  }


  private showModal() {
    // Store current focus
    this.previousFocus = document.activeElement as HTMLElement;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Focus first focusable element or modal itself
    requestAnimationFrame(() => {
      const firstFocusable = this.panel?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        this.panel?.focus();
      }
    });

    this.dispatchOpenEvent();
  }

  private hideModal() {
    // Restore body scroll
    document.body.style.overflow = '';

    // Restore previous focus
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }

    this.dispatchCloseEvent();
  }

  private trapFocus(e: KeyboardEvent) {
    if (!this.panel) return;

    const focusableElements = this.panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const focusable = Array.from(focusableElements);
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }

  @dispatch('@snice/modal-open', { bubbles: true, composed: true })
  private dispatchOpenEvent() {
    return { modal: this };
  }

  @dispatch('@snice/modal-close', { bubbles: true, composed: true })
  private dispatchCloseEvent() {
    return { modal: this };
  }

  // Public API
  show() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

}