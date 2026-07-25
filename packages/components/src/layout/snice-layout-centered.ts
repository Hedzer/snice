import { element, property, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-layout-centered.css?inline';

@element('snice-layout-centered')
export class SniceLayoutCentered extends HTMLElement {
  @property({  })
  width: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  @property({ attribute: false })
  hasBrand = false;

  @property({ attribute: false })
  hasFooter = false;

  @render()
  render() {
    return html/*html*/`
      <div class="layout">
        <div class="stack">
          <div class="brand${this.hasBrand ? '' : ' brand--empty'}">
            <slot name="brand"></slot>
          </div>

          <div class="container">
            <slot name="page"></slot>
          </div>

          <div class="footer${this.hasFooter ? '' : ' footer--empty'}">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }

  @ready()
  wireSlotDetection() {
    this.syncSlotState();
    this.shadowRoot?.addEventListener('slotchange', () => this.syncSlotState());
  }

  private syncSlotState() {
    this.hasBrand = !!this.querySelector('[slot="brand"]');
    this.hasFooter = !!this.querySelector('[slot="footer"]');
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }
}
