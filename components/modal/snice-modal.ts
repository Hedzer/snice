import { element, property, query, watch, ready, dispose, dispatch, render, styles, html, css } from 'snice';
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

  @property({ type: Boolean, attribute: 'no-header',  })
  noHeader = false;

  @property({ type: Boolean, attribute: 'no-footer',  })
  noFooter = false;

  @property({  })
  label = '';

  @query('.modal')
  modal?: HTMLElement;

  @query('.modal__panel')
  panel?: HTMLElement;

  @query('.modal__backdrop')
  backdrop?: HTMLElement;

  private previousFocus: HTMLElement | null = null;
  private lockedBodyScroll = false;
  private headerId = `snice-modal-header-${Math.random().toString(36).slice(2, 10)}`;

  @render()
  render() {
    const modalClass = `modal${this.open ? ' modal--open' : ''}`;
    const panelClass = `modal__panel modal__panel--${this.size}`;
    const ariaHidden = this.open ? 'false' : 'true';
    // Prefer explicit label; reference slotted header via aria-labelledby.
    // Always provide a non-empty aria-label fallback so SRs never announce
    // an empty dialog name (aria-labelledby will override when present).
    const useHeaderForLabel = !this.label && !this.noHeader;
    const ariaLabel = this.label || 'Dialog';

    return html/*html*/`
      <div class="${modalClass}"
           role="dialog"
           aria-modal="true"
           aria-label="${ariaLabel}"
           aria-labelledby="${useHeaderForLabel ? this.headerId : ''}"
           aria-hidden="${ariaHidden}"
           @click=${this.handleBackdropClick}
           @keydown=${this.handleKeydown}>
        <div class="modal__backdrop" part="backdrop"></div>
        <div class="${panelClass}" part="panel">
          <if ${!this.noHeader}>
            <div class="modal__header" part="header" id="${this.headerId}">
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
          </if>
          <div class="modal__body" part="body">
            <slot></slot>
          </div>
          <if ${!this.noFooter}>
            <div class="modal__footer" part="footer">
              <slot name="footer"></slot>
            </div>
          </if>
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

  @dispose()
  cleanup() {
    if (this.lockedBodyScroll) {
      document.body.style.overflow = '';
      this.lockedBodyScroll = false;
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
    this.lockedBodyScroll = true;

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
    // Restore body scroll (only if we locked it)
    if (this.lockedBodyScroll) {
      document.body.style.overflow = '';
      this.lockedBodyScroll = false;
    }

    // Restore previous focus (only if still in the DOM)
    if (this.previousFocus) {
      if (this.previousFocus.isConnected) {
        this.previousFocus.focus();
      }
      this.previousFocus = null;
    }

    this.dispatchCloseEvent();
  }

  private trapFocus(e: KeyboardEvent) {
    if (!this.panel) return;

    const FOCUS_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    // Collect focusables from BOTH the shadow panel AND any slotted (light DOM)
    // children the consumer puts inside <snice-modal>. The shadow-only query
    // would miss <input> etc. that users provide as children.
    const shadowFocusable = Array.from(this.panel.querySelectorAll<HTMLElement>(FOCUS_SELECTOR));
    const lightFocusable = Array.from(this.querySelectorAll<HTMLElement>(FOCUS_SELECTOR));
    const focusable = [...shadowFocusable, ...lightFocusable].filter(el => !(el as any).disabled);
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    // Active element can be in the shadow root or in light DOM
    const active = (this.shadowRoot as any)?.activeElement ?? document.activeElement;

    if (e.shiftKey) {
      if (active === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (active === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }

  @dispatch('modal-open', { bubbles: true, composed: true })
  private dispatchOpenEvent() {
    return { modal: this };
  }

  @dispatch('modal-close', { bubbles: true, composed: true })
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