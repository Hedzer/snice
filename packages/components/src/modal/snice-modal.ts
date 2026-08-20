import { element, property, query, watch, ready, dispose, dispatch, render, styles, html, css, unsafeHTML } from 'snice';
import { X_MARK } from '../icons';
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

  @property({ type: Boolean, attribute: 'top-layer',  })
  topLayer = false;

  @property({ reflect: false })
  container?: string | Element;

  @property({ attribute: false })
  private hasFooterContent = false;

  @property({ attribute: false })
  private hasHeaderContent = false;

  @property({ attribute: false })
  private containerActive = false;

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
  private containerEl: Element | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private boundWindowResize = () => this.measureContainerBounds();
  private boundContainerScroll = () => this.measureContainerBounds();
  private overlayHideTimer: number | null = null;
  private containerClearTimer: number | null = null;

  @render()
  render() {
    const modalClass = `modal${this.open ? ' modal--open' : ''}${this.containerActive ? ' modal--container' : ''}`;
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
            <div class="modal__header${this.hasHeaderContent || !this.noCloseButton ? '' : ' modal__header--empty'}" part="header" id="${this.headerId}">
              <slot name="header"></slot>
              <if ${!this.noCloseButton}>
                <button class="modal__close"
                        part="close"
                        aria-label="Close modal"
                        @click=${this.handleCloseClick}>${unsafeHTML(X_MARK)}</button>
              </if>
            </div>
          </if>
          <div class="modal__body" part="body">
            <slot></slot>
          </div>
          <if ${!this.noFooter}>
            <div class="modal__footer${this.hasFooterContent ? '' : ' modal__footer--empty'}" part="footer">
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

    // A container holding a <slot> is never :empty, so track assignment
    // instead of relying on a CSS rule that can never match.
    this.syncFooterState();
    this.shadowRoot?.addEventListener('slotchange', () => this.syncFooterState());
  }

  private syncFooterState() {
    this.hasFooterContent = !!this.querySelector('[slot="footer"]');
    this.hasHeaderContent = !!this.querySelector('[slot="header"]');
  }

  @dispose()
  cleanup() {
    // A dispose inside a transition window must not fire the deferred work on
    // a detached element: cancel both timers, then tear the container pinning
    // down immediately (dispose is not a close — there is no exit transition
    // left to preserve).
    if (this.overlayHideTimer !== null) {
      window.clearTimeout(this.overlayHideTimer);
      this.overlayHideTimer = null;
    }
    if (this.containerClearTimer !== null) {
      window.clearTimeout(this.containerClearTimer);
      this.containerClearTimer = null;
    }
    this.teardownContainerTracking(false);
    if (this.lockedBodyScroll) {
      document.body.style.overflow = '';
      this.lockedBodyScroll = false;
    }
  }

  @watch('open')
  handleOpenChange(oldValue?: boolean) {
    if (oldValue === undefined) return; // initial value; @ready applies it

    if (this.open) {
      this.showModal();
    } else {
      this.hideModal();
    }
  }

  @watch('container')
  handleContainerChange() {
    if (this.open) {
      this.setupContainerTracking();
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

    this.setupContainerTracking();
    this.showOverlay();

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
    // `hideOverlay()` first: its timer is registered before the deferred
    // container clear (same transition window), so the popover leaves the top
    // layer before the geometry snap could ever paint.
    this.hideOverlay();
    // Stop the observers/listeners NOW — they must not fire mid-transition —
    // but defer the container geometry/class clearing until the exit
    // transition has run, so the overlay stays pinned to the container's box
    // and the panel never re-centers while it fades out.
    this.teardownContainerTracking();

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

  // `top-layer` lifts the overlay into the browser TOP LAYER via the native
  // Popover API, making it immune to ancestor stacking contexts (e.g. a shell
  // header at z-index 1020) that no --modal-z-index could beat. Unsupported
  // engines fall back to today's class-only toggle and z-index stacking.
  private showOverlay() {
    const overlay = this.modal;
    if (!overlay || !this.topLayer || typeof overlay.showPopover !== 'function') return;
    if (overlay.getAttribute('popover') !== 'manual') {
      overlay.setAttribute('popover', 'manual');
    }
    // The UA `[popover]` sheet sizes the overlay to fit-content with
    // margin auto; inline geometry overrides it so the fixed box stretches
    // exactly to its inset box (viewport, or container box when set).
    this.applyOverlayGeometry(overlay);
    try { overlay.showPopover(); } catch { /* already open */ }
  }

  private hideOverlay() {
    const overlay = this.modal;
    if (!overlay || !this.topLayer || typeof overlay.hidePopover !== 'function') return;
    if (this.overlayHideTimer !== null) window.clearTimeout(this.overlayHideTimer);
    // The UA applies display:none to a hidden popover, which would kill the
    // fade/scale-out transition. The modal--open class is already removed by
    // render; wait out the transition, then hide the popover.
    this.overlayHideTimer = window.setTimeout(() => {
      this.overlayHideTimer = null;
      if (this.open) return; // reopened before the transition finished
      try { overlay.hidePopover(); } catch { /* never shown */ }
    }, this.modalTransitionDuration());
  }

  // The total exit-transition window: the panel's
  // `var(--modal-transition-duration, 260ms)` (snice-modal.css consumes the
  // same variable, so the knob drives the transition) plus its fixed 80ms
  // delay. `hideOverlay()` and the deferred container clear both wait on
  // this, so neither can clip the fade nor fire before it has ended.
  private modalTransitionDuration(): number {
    const raw = getComputedStyle(this).getPropertyValue('--modal-transition-duration').trim();
    const match = /^([\d.]+)(ms|s)$/.exec(raw);
    const duration = match
      ? (match[2] === 's' ? parseFloat(match[1]) * 1000 : parseFloat(match[1]))
      : 260; // the CSS default in snice-modal.css
    return duration + 80; // the panel transition's fixed delay
  }

  // `container` pins the fixed overlay to the container's bounding box instead
  // of the viewport; the panel then centers inside that box (a modal that
  // excludes a sidebar: container="main").
  private resolveContainer(): Element | null {
    if (typeof this.container === 'string') {
      if (!this.container.trim()) return null;
      try {
        return document.querySelector(this.container);
      } catch {
        return null; // invalid selector
      }
    }
    return this.container ?? null;
  }

  private setupContainerTracking() {
    // Immediate teardown: a re-setup while open (container change) must not
    // leave the previous geometry around — it is cleared before the new box
    // is measured, all synchronously ahead of the next render commit.
    this.teardownContainerTracking(false);
    this.containerEl = this.resolveContainer();
    if (!this.containerEl) {
      if (this.container) {
        console.warn(`snice-modal: container "${this.container}" not found; falling back to the viewport`);
      }
      return;
    }
    this.containerActive = true;
    this.measureContainerBounds();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measureContainerBounds());
      this.resizeObserver.observe(this.containerEl);
    }
    window.addEventListener('resize', this.boundWindowResize);
    this.containerEl.addEventListener('scroll', this.boundContainerScroll, true);
  }

  // Splits into an immediate half and a deferred half. The immediate half —
  // observers and listeners — must die the moment the modal closes so nothing
  // can re-measure mid-transition. The geometry half (inline styles +
  // `containerActive`, which owns the `.modal--container` class) is deferred
  // past the exit transition by default: clearing it synchronously would snap
  // the overlay back to the viewport box and re-center the panel in the same
  // frame the fade starts (F1). `hideModal` wants the deferred half; `cleanup`
  // and `setupContainerTracking` pass `false` because there is no transition
  // left to preserve on dispose, and re-setup re-applies fresh geometry.
  private teardownContainerTracking(deferClear = true) {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('resize', this.boundWindowResize);
    this.containerEl?.removeEventListener('scroll', this.boundContainerScroll, true);
    this.containerEl = null;
    if (deferClear && this.containerActive) {
      this.scheduleContainerGeometryClear();
    } else {
      this.clearContainerGeometry();
    }
  }

  private scheduleContainerGeometryClear() {
    if (this.containerClearTimer !== null) return;
    this.containerClearTimer = window.setTimeout(() => {
      this.containerClearTimer = null;
      if (this.open) return; // reopened before the transition finished
      this.clearContainerGeometry();
    }, this.modalTransitionDuration());
  }

  private clearContainerGeometry() {
    if (this.containerClearTimer !== null) {
      window.clearTimeout(this.containerClearTimer);
      this.containerClearTimer = null;
    }
    this.containerActive = false;
    if (this.modal) {
      this.modal.style.inset = '';
      this.modal.style.width = '';
      this.modal.style.height = '';
      this.modal.style.margin = '';
    }
  }

  private measureContainerBounds() {
    const overlay = this.modal;
    if (!overlay || !this.containerEl) return;
    this.applyOverlayGeometry(overlay);
  }

  // Inline geometry: overrides both the component sheet and the UA popover
  // sheet (`inset:0; width/height:fit-content; margin:auto`). With all four
  // insets defined and width/height auto, a fixed box stretches exactly to
  // its inset box, so the backdrop always covers the full viewport/container.
  private applyOverlayGeometry(overlay: HTMLElement) {
    if (this.containerEl) {
      const rect = this.containerEl.getBoundingClientRect();
      overlay.style.inset =
        `${rect.top}px ${window.innerWidth - rect.right}px ${window.innerHeight - rect.bottom}px ${rect.left}px`;
    } else {
      overlay.style.inset = '0';
    }
    overlay.style.width = 'auto';
    overlay.style.height = 'auto';
    overlay.style.margin = '0';
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