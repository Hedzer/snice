import { element, property, query, watch, dispatch, on, ready, dispose, reconnect, render, styles, html, css } from 'snice';
import cssContent from './snice-popover.css?inline';
import type {
  PopoverPlacement,
  SnicePopoverElement,
  PopoverOpenDetail,
  PopoverCloseDetail,
} from './snice-popover.types';

/**
 * <snice-popover> — click-triggered, interactive panel anchored to a trigger.
 *
 * Distinct from <snice-tooltip> (hover-triggered, non-interactive text/HTML).
 * Distinct from <snice-menu> (popover specialised for menu items + keyboard nav).
 *
 * Slots:
 *   - trigger: the element that toggles the panel
 *   - default: the panel's contents
 */
@element('snice-popover')
export class SnicePopover extends HTMLElement implements SnicePopoverElement {
  @property({ type: Boolean })
  open = false;

  @property()
  placement: PopoverPlacement = 'bottom-end';

  @property({ type: Number })
  distance = 6;

  @property({ type: Boolean, attribute: 'no-outside-dismiss' })
  noOutsideDismiss = false;

  @property({ type: Boolean, attribute: 'no-escape-dismiss' })
  noEscapeDismiss = false;

  @query('.popover')
  private rootElement?: HTMLElement;

  @query('.popover__trigger')
  private triggerElement?: HTMLElement;

  @query('.popover__panel')
  private panel?: HTMLElement;

  private repositionHandler = () => this.position();
  private boundOutsideClick = (e: MouseEvent) => this.handleOutsideClick(e);
  private boundEscape = (e: KeyboardEvent) => this.handleEscape(e);

  @render()
  renderContent() {
    const panelClasses = [
      'popover__panel',
      `popover__panel--${this.placement}`,
      this.open ? 'popover__panel--open' : '',
    ].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="popover">
        <div class="popover__trigger" part="trigger" tabindex="0" role="button"
             aria-haspopup="dialog"
             aria-expanded="${this.open ? 'true' : 'false'}">
          <slot name="trigger"></slot>
        </div>
        <div class="${panelClasses}" part="panel" role="dialog" popover="manual">
          <div class="popover__content" part="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    document.addEventListener('mousedown', this.boundOutsideClick, true);
    document.addEventListener('keydown', this.boundEscape, true);

    // @watch('open') fires before the panel exists on upgrade, so an authored
    // open attribute would otherwise never show the panel.
    if (this.open) {
      this.handleOpenChange();
    }
  }

  @reconnect()
  onReconnect() {
    document.addEventListener('mousedown', this.boundOutsideClick, true);
    document.addEventListener('keydown', this.boundEscape, true);
  }

  @dispose()
  cleanup() {
    document.removeEventListener('mousedown', this.boundOutsideClick, true);
    document.removeEventListener('keydown', this.boundEscape, true);
    window.removeEventListener('resize', this.repositionHandler);
    window.removeEventListener('scroll', this.repositionHandler, true);
  }

  @on('click', { target: '.popover__trigger' })
  handleTriggerClick(e: MouseEvent) {
    e.stopPropagation();
    this.toggle();
  }

  @on('keydown', { target: '.popover__trigger' })
  handleTriggerKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggle();
    }
  }

  @watch('open')
  handleOpenChange() {
    if (!this.panel) return;

    if (this.open) {
      // Show first: until showPopover() lands the panel carries the UA's
      // `[popover]:not(:popover-open) { display: none }` rule, so measuring
      // before it answers 0x0 and every placement that subtracts the panel's
      // own box lands in the wrong place.
      if (typeof this.panel.showPopover === 'function') {
        try { this.panel.showPopover(); } catch { /* already open */ }
      }
      this.position();
      window.addEventListener('resize', this.repositionHandler);
      window.addEventListener('scroll', this.repositionHandler, true);
      this.dispatchOpenEvent();
    } else {
      window.removeEventListener('resize', this.repositionHandler);
      window.removeEventListener('scroll', this.repositionHandler, true);
      if (typeof this.panel.hidePopover === 'function') {
        try { this.panel.hidePopover(); } catch { /* already closed */ }
      }
      this.dispatchCloseEvent();
    }
  }

  private handleOutsideClick(e: MouseEvent) {
    if (!this.open || this.noOutsideDismiss) return;
    const path = e.composedPath();
    if (path.includes(this)) return;
    // Allow nested overlays (snice-select dropdown, secondary picker menus
    // appended to body, native browser UI) to keep the popover open.
    if (path.some((n: any) => {
      if (n?.tagName === 'SNICE-SELECT') return true;
      if (n?.dataset && 'snicePopoverOwned' in n.dataset) return true;
      return false;
    })) return;
    this.hide();
  }

  private handleEscape(e: KeyboardEvent) {
    if (!this.open || this.noEscapeDismiss) return;
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    this.hide();
    this.triggerElement?.focus();
  }

  private position() {
    if (!this.panel || !this.triggerElement) return;
    const a = this.triggerElement.getBoundingClientRect();
    const p = this.panel.getBoundingClientRect();
    const margin = 4;
    const dist = this.distance;
    let top = 0;
    let left = 0;

    switch (this.placement) {
      case 'top':
        top = a.top - p.height - dist;
        left = a.left + a.width / 2 - p.width / 2;
        break;
      case 'top-start':
        top = a.top - p.height - dist;
        left = a.left;
        break;
      case 'top-end':
        top = a.top - p.height - dist;
        left = a.right - p.width;
        break;
      case 'bottom':
        top = a.bottom + dist;
        left = a.left + a.width / 2 - p.width / 2;
        break;
      case 'bottom-start':
        top = a.bottom + dist;
        left = a.left;
        break;
      case 'bottom-end':
      default:
        top = a.bottom + dist;
        left = a.right - p.width;
        break;
      case 'left':
        top = a.top + a.height / 2 - p.height / 2;
        left = a.left - p.width - dist;
        break;
      case 'left-start':
        top = a.top;
        left = a.left - p.width - dist;
        break;
      case 'left-end':
        top = a.bottom - p.height;
        left = a.left - p.width - dist;
        break;
      case 'right':
        top = a.top + a.height / 2 - p.height / 2;
        left = a.right + dist;
        break;
      case 'right-start':
        top = a.top;
        left = a.right + dist;
        break;
      case 'right-end':
        top = a.bottom - p.height;
        left = a.right + dist;
        break;
    }

    // Clamp to viewport
    if (left < margin) left = margin;
    if (left + p.width > window.innerWidth - margin) left = window.innerWidth - p.width - margin;
    if (top < margin) top = margin;
    if (top + p.height > window.innerHeight - margin) top = window.innerHeight - p.height - margin;

    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
  }

  @dispatch('popover-open', { bubbles: true, composed: true })
  private dispatchOpenEvent(): PopoverOpenDetail {
    return { popover: this };
  }

  @dispatch('popover-close', { bubbles: true, composed: true })
  private dispatchCloseEvent(): PopoverCloseDetail {
    return { popover: this };
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
