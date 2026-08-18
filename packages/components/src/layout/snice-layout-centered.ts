import { element, property, ready, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-centered.css?inline';

@element('snice-layout-centered')
export class SniceLayoutCentered extends HTMLElement implements Layout {
  @property({  })
  width: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  /** Size to the parent element instead of filling the screen. */
  @property({ type: Boolean })
  contained = false;

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

  private placards: Placard[] = [];
  private currentRoute = '';

  update(_appContext: AppContext, placards: Placard[], currentRoute: string, _routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;
  }
}
