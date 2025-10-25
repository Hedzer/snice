import { element, property, dispatch, on, render, styles, html, css } from 'snice';
import cssContent from './snice-menu-item.css?inline';
import type { SniceMenuItemElement, MenuItemSelectDetail } from './snice-menu-item.types';

@element('snice-menu-item')
export class SniceMenuItem extends HTMLElement implements SniceMenuItemElement {
  @property({ type: Boolean })
  disabled = false;

  @property({  })
  value = '';

  @property({ type: Boolean })
  selected = false;

  @on('click')
  handleClick(e: MouseEvent) {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.stopPropagation();
    this.dispatchSelectEvent();
  }

  @dispatch('@snice/menu-item-select', { bubbles: true, composed: true })
  private dispatchSelectEvent(): MenuItemSelectDetail {
    return {
      item: this,
      value: this.value
    };
  }

  @render()
  renderContent() {
    const itemClasses = [
      'menu-item',
      this.selected ? 'menu-item--selected' : '',
      this.disabled ? 'menu-item--disabled' : ''
    ].filter(Boolean).join(' ');

    return html`
      <div class="${itemClasses}" part="item" role="menuitem" aria-disabled="${this.disabled}">
        <span class="menu-item__icon" part="icon">
          <slot name="icon"></slot>
        </span>
        <span class="menu-item__label" part="label">
          <slot></slot>
        </span>
        <span class="menu-item__shortcut" part="shortcut">
          <slot name="shortcut"></slot>
        </span>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }
}
