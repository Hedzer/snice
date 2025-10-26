import { element, property, query, watch, dispatch, on, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-menu.css?inline';
import type { MenuPlacement, MenuTrigger, SniceMenuElement, MenuOpenDetail, MenuCloseDetail } from './snice-menu.types';

@element('snice-menu')
export class SniceMenu extends HTMLElement implements SniceMenuElement {
  @property({ type: Boolean })
  open = false;

  @property({  })
  placement: MenuPlacement = 'bottom-start';

  @property({  })
  trigger: MenuTrigger = 'click';

  @property({ type: Boolean, attribute: 'close-on-select' })
  closeOnSelect = true;

  @property({ type: Number })
  distance = 4;

  @query('.menu__panel')
  panel?: HTMLElement;

  @query('.menu__trigger')
  triggerElement?: HTMLElement;

  private closeOnOutsideClick = (e: MouseEvent) => {
    if (!this.open) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this.closeMenu();
    }
  };

  @ready()
  init() {
    this.style.setProperty('--menu-distance', `${this.distance}px`);
  }

  connectedCallback() {
    document.addEventListener('click', this.closeOnOutsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.closeOnOutsideClick);
  }

  @watch('open')
  handleOpenChange() {
    if (this.open) {
      this.dispatchOpenEvent();
    } else {
      this.dispatchCloseEvent();
    }
  }

  @watch('distance')
  handleDistanceChange() {
    this.style.setProperty('--menu-distance', `${this.distance}px`);
  }

  @on('click', { target: '.menu__trigger' })
  handleTriggerClick(e: MouseEvent) {
    if (this.trigger === 'click' || this.trigger === 'manual') {
      e.stopPropagation();
      this.toggleMenu();
    }
  }

  @on('mouseenter', { target: '.menu__trigger' })
  handleTriggerMouseEnter() {
    if (this.trigger === 'hover') {
      this.openMenu();
    }
  }

  @on('mouseleave')
  handleMouseLeave() {
    if (this.trigger === 'hover') {
      this.closeMenu();
    }
  }

  @on('@snice/menu-item-select')
  handleMenuItemSelect(e: CustomEvent) {
    if (this.closeOnSelect) {
      this.closeMenu();
    }
  }

  @dispatch('@snice/menu-open', { bubbles: true, composed: true })
  private dispatchOpenEvent(): MenuOpenDetail {
    return { menu: this };
  }

  @dispatch('@snice/menu-close', { bubbles: true, composed: true })
  private dispatchCloseEvent(): MenuCloseDetail {
    return { menu: this };
  }

  @render()
  render() {
    const panelClasses = [
      'menu__panel',
      `menu__panel--${this.placement}`,
      this.open ? 'menu__panel--open' : ''
    ].filter(Boolean).join(' ');

    return html`
      <div class="menu">
        <div class="menu__trigger" part="trigger">
          <span class="menu__image-left" part="image-left">
            <slot name="image-left"></slot>
          </span>
          <slot name="trigger"></slot>
          <span class="menu__image-right" part="image-right">
            <slot name="image-right"></slot>
          </span>
        </div>

        <div class="${panelClasses}" part="panel" role="menu">
          <div class="menu__content" part="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Public API
  openMenu() {
    this.open = true;
  }

  closeMenu() {
    this.open = false;
  }

  toggleMenu() {
    this.open = !this.open;
  }
}
