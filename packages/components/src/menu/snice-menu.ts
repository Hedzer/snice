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

  @query('.menu')
  menuElement?: HTMLElement;

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

  @watch('open', { immediate: false })
  handleOpenChange() {
    if (this.open) {
      this.showPanel();
      this.dispatchOpenEvent();
    } else {
      if (this.panel) {
        if (typeof this.panel.hidePopover === 'function') {
          this.panel.hidePopover();
        }
      }
      this.dispatchCloseEvent();
    }
  }

  @watch('distance')
  handleDistanceChange() {
    this.style.setProperty('--menu-distance', `${this.distance}px`);
  }

  @on('click', { target: '.menu__trigger' })
  handleTriggerClick(e: MouseEvent) {
    if (this.trigger === 'click') {
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

  @on('menu-item-select')
  handleMenuItemSelect(e: CustomEvent) {
    if (this.closeOnSelect) {
      this.closeMenu();
    }
  }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    if (!this.open) {
      // Enter/Space on trigger opens the menu and focuses first item
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') &&
          (e.target as HTMLElement).closest?.('.menu__trigger')) {
        e.preventDefault();
        this.openMenu();
        requestAnimationFrame(() => this.focusItemAt(0));
      }
      return;
    }

    // While open
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeMenu();
      this.triggerElement?.focus();
      return;
    }

    const items = this.getFocusableItems();
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.focusItemAt((current + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusItemAt((current - 1 + items.length) % items.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.focusItemAt(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.focusItemAt(items.length - 1);
    }
  }

  private getFocusableItems(): HTMLElement[] {
    return Array.from(this.querySelectorAll('snice-menu-item, [role="menuitem"]')) as HTMLElement[];
  }

  private focusItemAt(index: number) {
    const items = this.getFocusableItems();
    items[index]?.focus();
  }

  @dispatch('menu-open', { bubbles: true, composed: true })
  private dispatchOpenEvent(): MenuOpenDetail {
    return { menu: this };
  }

  @dispatch('menu-close', { bubbles: true, composed: true })
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

    return html/*html*/`
      <div class="menu">
        <div class="menu__trigger" part="trigger"
             tabindex="0"
             role="button"
             aria-haspopup="menu"
             aria-expanded="${this.open ? 'true' : 'false'}">
          <span class="menu__image-left" part="image-left">
            <slot name="image-left"></slot>
          </span>
          <slot name="trigger"></slot>
          <span class="menu__image-right" part="image-right">
            <slot name="image-right"></slot>
          </span>
        </div>

        <div class="${panelClasses}" part="panel" role="menu" popover="manual">
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

  /** Display the panel first — a `display: none` panel measures 0x0 — then
   * place it. Anchor-positioning engines are placed entirely by CSS. */
  private showPanel() {
    if (!this.panel) return;
    if (typeof this.panel.showPopover === 'function') {
      this.panel.showPopover();
    }
    this.positionMenu();
  }

  private positionMenu() {
    if (!this.panel || !this.menuElement || CSS.supports('position-anchor', '--a')) return;
    const anchor = this.menuElement.getBoundingClientRect();
    const floor = parseFloat(getComputedStyle(this.panel).minWidth) || 0;
    this.panel.style.minWidth = `${Math.max(anchor.width, floor)}px`;
    const box = this.panel.getBoundingClientRect();
    const distance = this.distance;
    let top = 0;
    let left = 0;

    switch (this.placement) {
      case 'bottom-end':
        top = anchor.bottom + distance;
        left = anchor.right - box.width;
        break;
      case 'top-start':
        top = anchor.top - distance - box.height;
        left = anchor.left;
        break;
      case 'top-end':
        top = anchor.top - distance - box.height;
        left = anchor.right - box.width;
        break;
      case 'right-start':
        top = anchor.top;
        left = anchor.right + distance;
        break;
      case 'right-end':
        top = anchor.bottom - box.height;
        left = anchor.right + distance;
        break;
      case 'left-start':
        top = anchor.top;
        left = anchor.left - distance - box.width;
        break;
      case 'left-end':
        top = anchor.bottom - box.height;
        left = anchor.left - distance - box.width;
        break;
      case 'bottom-start':
      default:
        top = anchor.bottom + distance;
        left = anchor.left;
        break;
    }

    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
  }

  // Public API
  openMenu() {
    this.open = true;
    this.showPanel();
  }

  closeMenu() {
    this.open = false;
    if (this.panel) {
      if (typeof this.panel.hidePopover === 'function') {
        this.panel.hidePopover();
      }
    }
  }

  toggleMenu() {
    if (this.open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }
}
