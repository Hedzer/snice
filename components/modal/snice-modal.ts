import { element, property, query, watch, ready, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-modal.css?inline';
import type { ModalSize, SniceModalElement } from './snice-modal.types';

@element('snice-modal')
export class SniceModal extends HTMLElement implements SniceModalElement {
  @property({ type: Boolean,  })
  open = false;

  @property({  })
  size: ModalSize = 'medium';

  @property({ type: Boolean, attribute: 'no-backdrop-dismiss',  })
  noBackdropDismiss = false;

  @property({ type: Boolean, attribute: 'no-escape-dismiss',  })
  noEscapeDismiss = false;

  @property({ type: Boolean, attribute: 'no-focus-trap',  })
  noFocusTrap = false;

  @property({ type: Boolean, attribute: 'no-close-button',  })
  noCloseButton = false;

  @property({  })
  label = '';

  @query('.modal')
  modal?: HTMLElement;

  @query('.modal__panel')
  panel?: HTMLElement;

  @query('.modal__backdrop')
  backdrop?: HTMLElement;

  private previousFocus: HTMLElement | null = null;

  @render()
  render() {
    const modalClass = `modal${this.open ? ' modal--open' : ''}`;
    const panelClass = `modal__panel modal__panel--${this.size}`;
    const ariaHidden = this.open ? 'false' : 'true';

    return html/*html*/`
      <div class="${modalClass}"
           role="dialog"
           aria-modal="true"
           aria-label="${this.label}"
           aria-hidden="${ariaHidden}"
           @click=${this.handleBackdropClick}
           @keydown=${this.handleKeydown}>
        <div class="modal__backdrop" part="backdrop"></div>
        <div class="${panelClass}" part="panel">
          <div class="modal__header" part="header">
            <slot name="header"></slot>
            <if ${!this.noCloseButton}>
              <button class="modal__close"
                      part="close"
                      aria-label="Close modal"
                      @click=${this.handleCloseClick}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                </svg>
              </button>
            </if>
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

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    // Make sure modal state is properly initialized
    if (this.open) {
      this.showModal();
    }
  }

  @watch('open')
  handleOpenChange() {
    // Handle side effects when modal opens/closes
    if (this.open) {
      this.showModal();
    } else {
      this.hideModal();
    }
  }

  private handleBackdropClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('modal__backdrop')) return;
    if (!this.noBackdropDismiss) {
      this.close();
    }
  }

  private handleCloseClick(e: Event) {
    e.stopPropagation();
    this.close();
  }

  private handleKeydown(e: KeyboardEvent) {
    if (!this.open) return;

    if (e.key === 'Escape' && !this.noEscapeDismiss) {
      e.stopPropagation();
      this.close();
    }

    if (e.key === 'Tab' && !this.noFocusTrap) {
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