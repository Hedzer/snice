import { element, property, query, on, watch, ready, dispose, render, styles, html, css as cssTag, unsafeHTML, lockBodyScroll, unlockBodyScroll } from 'snice';
import { X_MARK } from '../icons';
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

  @property({ type: Boolean,  })
  inline = false;

  @property({ type: Number })
  breakpoint = 0;

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

  @property({ type: Boolean, attribute: 'no-header' })
  noHeader = false;

  @property({ type: Boolean, attribute: 'no-footer' })
  noFooter = false;

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
  private breakpointQuery?: MediaQueryList;
  /** Track whether THIS drawer holds a body-scroll lock — keeps the
   *  per-instance state in sync with the shared refcount so we never
   *  unlock more times than we locked. */
  private scrollLocked = false;
  private boundBreakpointHandler?: (e: MediaQueryListEvent) => void;

  @render()
  render() {
    const titleId = this.titleId;
    // If there's a slotted title, reference it; otherwise fall back to a
    // static label so the dialog is never announced without a name.
    return html/*html*/`
      <div class="drawer-backdrop" part="backdrop"></div>

      <div class="drawer" role="dialog" aria-modal="true"
           aria-labelledby="${this.noHeader ? '' : titleId}"
           aria-label="${this.noHeader ? 'Drawer' : ''}"
           tabindex="-1" part="base">
        <span class="focus-trap-start" tabindex="0"></span>

        <if ${!this.noHeader}>
          <div class="drawer-header" part="header">
            <h2 class="drawer-title" part="title" id="${titleId}">
              <slot name="title"></slot>
            </h2>
            <if ${!this.persistent}>
              <button class="drawer-close" type="button" aria-label="Close" part="close">${unsafeHTML(X_MARK)}</button>
            </if>
          </div>
        </if>

        <div class="drawer-body" part="body">
          <slot></slot>
        </div>

        <if ${!this.noFooter}>
          <div class="drawer-footer" part="footer">
            <slot name="footer"></slot>
          </div>
        </if>

        <span class="focus-trap-end" tabindex="0"></span>
      </div>
    `;
  }

  @styles()
  styles() {
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

    // Set up breakpoint listener if specified
    if (this.breakpoint > 0) {
      this.setupBreakpointListener();
    }

    if (this.open && !this.isInlineActive()) {
      this.handleOpen();
    }
  }

  private isHandlingOpenChange = false;
  private titleId = `snice-drawer-title-${Math.random().toString(36).slice(2, 10)}`;

  /** Returns true if the drawer is currently in inline mode (either via `inline` prop or active breakpoint). */
  private isInlineActive(): boolean {
    return this.inline || this.hasAttribute('inline');
  }

  private setupBreakpointListener() {
    // Tear down existing listener
    this.teardownBreakpointListener();

    if (this.breakpoint <= 0) return;

    this.breakpointQuery = window.matchMedia(`(min-width: ${this.breakpoint}px)`);
    this.boundBreakpointHandler = (e: MediaQueryListEvent) => this.handleBreakpointChange(e.matches);

    // Apply initial state
    this.handleBreakpointChange(this.breakpointQuery.matches);

    this.breakpointQuery.addEventListener('change', this.boundBreakpointHandler);
  }

  private teardownBreakpointListener() {
    if (this.breakpointQuery && this.boundBreakpointHandler) {
      this.breakpointQuery.removeEventListener('change', this.boundBreakpointHandler);
      this.breakpointQuery = undefined;
      this.boundBreakpointHandler = undefined;
    }
  }

  private handleBreakpointChange(matches: boolean) {
    const wasInline = this.isInlineActive();

    if (matches) {
      // Above breakpoint → inline mode
      this.setAttribute('inline', '');
      // If was overlay and open, tear down overlay behaviors
      if (!wasInline && this.open) {
        this.teardownOverlayBehaviors();
      }
    } else {
      // Below breakpoint → overlay mode
      this.removeAttribute('inline');
      // If was inline and now overlay, re-apply overlay behaviors if open
      if (wasInline && this.open) {
        this.handleOpen();
      }
    }
  }

  private teardownOverlayBehaviors() {
    // Remove escape handler
    if (this.boundHandleEscape) {
      document.removeEventListener('keydown', this.boundHandleEscape);
      this.boundHandleEscape = undefined;
    }
  }

  @watch('breakpoint')
  handleBreakpointPropChange() {
    if (this.breakpoint > 0) {
      this.setupBreakpointListener();
    } else {
      this.teardownBreakpointListener();
      // If breakpoint removed, also remove inline if it was set by breakpoint
      // (user's explicit `inline` prop is separate)
      if (!this.inline) {
        this.removeAttribute('inline');
      }
    }
  }

  @watch('open')
  handleOpenChange() {
    // Prevent duplicate handling
    if (this.isHandlingOpenChange) return;
    this.isHandlingOpenChange = true;

    try {
      this.setAttribute('aria-hidden', String(!this.open));

      // In inline mode, skip overlay behaviors entirely
      if (this.isInlineActive()) return;

      if (this.open) {
        this.handleOpen();
      } else {
        this.handleClose();
      }
    } finally {
      this.isHandlingOpenChange = false;
    }
  }

  @on('click', '.drawer-backdrop')
  handleBackdropClick(e: MouseEvent) {
    if (!this.noBackdropDismiss && !this.persistent) {
      e.stopPropagation();
      this.hide();
    }
  }

  @on('click', '.drawer-close')
  handleCloseClick(e: MouseEvent) {
    if (this.persistent) return;
    e.stopPropagation();
    this.hide();
  }

  @on('focus', { target: '.focus-trap-start' })
  handleFocusTrapStart(e: Event) {
    if (!this.noFocusTrap) {
      // Focus the last focusable element in the drawer
      const focusableElements = this.getFocusableElements();
      if (focusableElements.length > 0) {
        (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
      }
    }
  }

  @on('focus', { target: '.focus-trap-end' })
  handleFocusTrapEnd(e: Event) {
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

    // Lock body scroll for full-page (non-contained) drawers.
    // Refcounted: stays locked while any other overlay is also locked.
    if (!this.contained && !this.scrollLocked) {
      lockBodyScroll();
      this.scrollLocked = true;
    }

    // Focus management (skip for contained drawers — they're in-page, not modal)
    if (!this.noFocusTrap && !this.contained && this.drawerElement) {
      this.drawerElement.focus({ preventScroll: true });
    }

    this.dispatchOpenEvent();
  }

  private handleClose() {
    // Remove escape key handler
    if (this.boundHandleEscape) {
      document.removeEventListener('keydown', this.boundHandleEscape);
      this.boundHandleEscape = undefined;
    }

    // Unlock body scroll for full-page (non-contained) drawers
    if (this.scrollLocked) {
      unlockBodyScroll();
      this.scrollLocked = false;
    }

    // Restore focus
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
      this.previousFocus = undefined;
    }

    this.dispatchCloseEvent();
  }

  private getFocusableElements(): Element[] {
    if (!this.drawerElement) return [];
    const selector =
      'a[href], button:not([disabled]), textarea:not([disabled]), ' +
      'input:not([disabled]), select:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])';
    // Include slotted (light DOM) focusables, same fix as modal.
    const shadow = Array.from(this.drawerElement.querySelectorAll(selector));
    const light = Array.from(this.querySelectorAll(selector));
    return [...shadow, ...light];
  }

  private lastEventType: string | null = null;
  private lastEventTime = 0;

  private dispatchOpenEvent() {
    // Prevent duplicate events within 100ms
    const now = Date.now();
    if (this.lastEventType === 'open' && (now - this.lastEventTime) < 100) {
      return;
    }
    this.lastEventType = 'open';
    this.lastEventTime = now;

    // Manually dispatch event
    this.dispatchEvent(new CustomEvent('drawer-open', {
      bubbles: true,
      composed: true,
      detail: { drawer: this }
    }));
  }

  private dispatchCloseEvent() {
    // Prevent duplicate events within 100ms
    const now = Date.now();
    if (this.lastEventType === 'close' && (now - this.lastEventTime) < 100) {
      return;
    }
    this.lastEventType = 'close';
    this.lastEventTime = now;

    // Manually dispatch event
    this.dispatchEvent(new CustomEvent('drawer-close', {
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
    this.teardownBreakpointListener();
    // Release body scroll lock if the drawer was open when disconnected
    if (this.scrollLocked) {
      unlockBodyScroll();
      this.scrollLocked = false;
    }
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