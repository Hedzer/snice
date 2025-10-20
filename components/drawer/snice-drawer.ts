import { element, property, query, on, watch, ready, dispose, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-drawer.css?inline';
import type { DrawerPosition, DrawerSize, SniceDrawerElement } from './snice-drawer.types';

@element('snice-drawer')
export class SniceDrawer extends HTMLElement implements SniceDrawerElement {
  @property({ type: Boolean,  })
  open = false;

  @property({  })
  position: DrawerPosition = 'left';

  @property({  })
  size: DrawerSize = 'medium';

  @property({ type: Boolean, attribute: 'no-backdrop',  })
  noBackdrop = false;

  @property({ type: Boolean, attribute: 'no-backdrop-dismiss',  })
  noBackdropDismiss = false;

  @property({ type: Boolean, attribute: 'no-escape-dismiss',  })
  noEscapeDismiss = false;

  @property({ type: Boolean, attribute: 'no-focus-trap',  })
  noFocusTrap = false;

  @property({ type: Boolean,  })
  persistent = false;

  @property({ type: Boolean, attribute: 'push-content',  })
  pushContent = false;

  @property({ type: Boolean,  })
  contained = false;

  @query('.drawer')
  drawerElement?: HTMLElement;

  @query('.drawer-backdrop')
  backdropElement?: HTMLElement;

  @query('.drawer-close')
  closeButton?: HTMLButtonElement;

  @query('.focus-trap-start')
  focusTrapStart?: HTMLElement;

  @query('.focus-trap-end')
  focusTrapEnd?: HTMLElement;

  private previousFocus?: HTMLElement;
  private boundHandleEscape?: (e: KeyboardEvent) => void;

  @render()
  renderContent() {
    return html`
      <div class="drawer-backdrop" part="backdrop"></div>

      <div class="drawer" role="dialog" aria-modal="true" tabindex="-1" part="base">
        <span class="focus-trap-start" tabindex="0"></span>

        <div class="drawer-header" part="header">
          <h2 class="drawer-title" part="title">
            <slot name="title"></slot>
          </h2>
          ${!this.persistent ? html`
            <button class="drawer-close" type="button" aria-label="Close" part="close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          ` : ''}
        </div>

        <div class="drawer-body" part="body">
          <slot></slot>
        </div>

        <div class="drawer-footer" part="footer">
          <slot name="footer"></slot>
        </div>

        <span class="focus-trap-end" tabindex="0"></span>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }

  @ready()
  init() {
    // Ensure default attributes are set
    if (!this.hasAttribute('position')) {
      this.setAttribute('position', this.position);
    }
    if (!this.hasAttribute('size')) {
      this.setAttribute('size', this.size);
    }
    
    this.setAttribute('role', 'complementary');
    this.setAttribute('aria-hidden', String(!this.open));
    
    // Pre-set transition for push content mode to avoid jump on first use
    if (this.pushContent) {
      const mainContent = document.querySelector('main') || document.body;
      if (mainContent && mainContent !== document.body) {
        (mainContent as HTMLElement).style.transition = 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      }
    }
    
    if (this.open) {
      this.handleOpen();
    }
  }

  private _isHandlingOpenChange = false;

  @watch('open')
  handleOpenChange() {
    // Prevent duplicate handling
    if (this._isHandlingOpenChange) return;
    this._isHandlingOpenChange = true;

    try {
      this.setAttribute('aria-hidden', String(!this.open));

      if (this.open) {
        this.handleOpen();
      } else {
        this.handleClose();
      }
    } finally {
      this._isHandlingOpenChange = false;
    }
  }

  @on('click')
  handleBackdropClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.matches('.drawer-backdrop')) return;

    if (!this.noBackdropDismiss && !this.persistent) {
      e.stopPropagation();
      this.hide();
    }
  }

  @on('click')
  handleCloseClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.matches('.drawer-close')) return;

    e.stopPropagation();
    this.hide();
  }

  @on('focus')
  handleFocusTrapStart(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.matches('.focus-trap-start')) return;

    if (!this.noFocusTrap) {
      // Focus the last focusable element in the drawer
      const focusableElements = this.getFocusableElements();
      if (focusableElements.length > 0) {
        (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
      }
    }
  }

  @on('focus')
  handleFocusTrapEnd(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.matches('.focus-trap-end')) return;

    if (!this.noFocusTrap) {
      // Focus the first focusable element in the drawer
      const focusableElements = this.getFocusableElements();
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }

  private handleOpen() {
    // Store current focus
    this.previousFocus = document.activeElement as HTMLElement;

    // Add escape key handler
    if (!this.noEscapeDismiss && !this.persistent) {
      this.boundHandleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.hide();
        }
      };
      document.addEventListener('keydown', this.boundHandleEscape);
    }

    // REMOVED: No longer manipulating document.body.style.overflow
    // The drawer is now contained and doesn't need to prevent body scroll

    // Focus management
    if (!this.noFocusTrap) {
      requestAnimationFrame(() => {
        if (this.drawerElement) {
          this.drawerElement.focus({ preventScroll: true });
        }
      });
    }

    // Push content if enabled (still supported for those who need it)
    if (this.pushContent) {
      this.updatePushContent();
    }

    this.dispatchOpenEvent();
  }

  private handleClose() {
    // Remove escape key handler
    if (this.boundHandleEscape) {
      document.removeEventListener('keydown', this.boundHandleEscape);
      this.boundHandleEscape = undefined;
    }

    // REMOVED: No longer manipulating document.body.style.overflow

    // Restore focus
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
      this.previousFocus = undefined;
    }

    // Reset push content
    if (this.pushContent) {
      this.updatePushContent();
    }

    this.dispatchCloseEvent();
  }

  private updatePushContent() {
    if (!this.pushContent) return;
    
    // Apply to body or main content container
    const mainContent = document.querySelector('main') || document.body;
    if (mainContent && mainContent !== document.body) {
      // Set transition first if not already set
      if (!mainContent.style.transition) {
        (mainContent as HTMLElement).style.transition = 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      }
      
      if (this.open) {
        // Use CSS custom property that's calculated in CSS based on size/position
        const amount = getComputedStyle(this).getPropertyValue('--drawer-push-amount');
        const property = this.position === 'left' || this.position === 'right' 
          ? 'marginLeft' 
          : 'marginTop';
        (mainContent as HTMLElement).style[property] = amount || '0px';
      } else {
        // Reset margins
        (mainContent as HTMLElement).style.marginLeft = '';
        (mainContent as HTMLElement).style.marginTop = '';
      }
    }
  }

  private getFocusableElements(): NodeListOf<Element> {
    if (!this.drawerElement) return document.querySelectorAll('none');
    
    return this.drawerElement.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), ' +
      'input:not([disabled]), select:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])'
    );
  }

  private _lastEventType: string | null = null;
  private _lastEventTime = 0;

  private dispatchOpenEvent() {
    // Prevent duplicate events within 100ms
    const now = Date.now();
    if (this._lastEventType === 'open' && (now - this._lastEventTime) < 100) {
      return;
    }
    this._lastEventType = 'open';
    this._lastEventTime = now;

    // Manually dispatch event
    this.dispatchEvent(new CustomEvent('@snice/drawer-open', {
      bubbles: true,
      composed: true,
      detail: { drawer: this }
    }));
  }

  private dispatchCloseEvent() {
    // Prevent duplicate events within 100ms
    const now = Date.now();
    if (this._lastEventType === 'close' && (now - this._lastEventTime) < 100) {
      return;
    }
    this._lastEventType = 'close';
    this._lastEventTime = now;

    // Manually dispatch event
    this.dispatchEvent(new CustomEvent('@snice/drawer-close', {
      bubbles: true,
      composed: true,
      detail: { drawer: this }
    }));
  }

  @dispose()
  cleanup() {
    if (this.boundHandleEscape) {
      document.removeEventListener('keydown', this.boundHandleEscape);
    }
    // REMOVED: No longer manipulating document.body.style.overflow
  }

  // Public API
  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }
}