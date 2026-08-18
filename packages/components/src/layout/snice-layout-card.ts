import { element, property, ready, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-card.css?inline';

@element('snice-layout-card')
export class SniceLayoutCard extends HTMLElement implements Layout {
  @property({  })
  columns: '1' | '2' | '3' | '4' | '6' = '3';

  @property({  })
  gap: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  /** Size to the parent element instead of filling the screen. */
  @property({ type: Boolean })
  contained = false;

  @property({ attribute: false })
  hasFooter = false;

  @property({ attribute: false })
  hasHeader = false;

  @render()
  render() {
    return html/*html*/`
      <div class="layout">
        <header class="header${this.hasHeader ? '' : ' header--empty'}">
          <slot name="header"></slot>
        </header>

        <main class="main">
          <div class="grid">
            <slot name="page"></slot>
          </div>
        </main>

        <footer class="footer${this.hasFooter ? '' : ' footer--empty'}">
          <slot name="footer"></slot>
        </footer>
      </div>
    `;
  }

  @ready()
  wireSlotDetection() {
    this.syncSlotState();
    this.shadowRoot?.addEventListener('slotchange', () => this.syncSlotState());
  }

  private syncSlotState() {
    this.hasFooter = !!this.querySelector('[slot="footer"]');
    this.hasHeader = !!this.querySelector('[slot="header"]');
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