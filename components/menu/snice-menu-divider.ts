import { element, render, styles, html, css } from 'snice';

@element('snice-menu-divider')
export class SniceMenuDivider extends HTMLElement {
  @render()
  render() {
    return html`
      <div class="menu-divider" part="divider" role="separator"></div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`
      :host {
        display: block;
        padding: 0.25rem 0;
      }

      .menu-divider {
        height: 1px;
        background-color: var(--snice-color-border, #e5e7eb);
      }
    `;
  }
}
