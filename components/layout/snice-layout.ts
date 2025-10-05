import { element, query, ready } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import css from './snice-layout.css?inline';
import '../nav/snice-nav.ts';
import type { SniceNav } from '../nav/snice-nav.ts';

@element('snice-layout')
export class SniceLayout extends HTMLElement implements Layout {
  @query('snice-nav')
  navElement!: SniceNav;

  private placards: Placard[] = [];
  private currentRoute = '';

  html() {
    return /*html*/`
      <div class="layout">
        <header class="header">
          <div class="brand">
            <slot name="brand">
              <h1>App</h1>
            </slot>
          </div>
          <snice-nav class="nav" variant="flat" orientation="horizontal"></snice-nav>
        </header>

        <main class="main">
          <slot name="page"></slot>
        </main>

        <footer class="footer">
          <slot name="footer">
          </slot>
        </footer>
      </div>
    `;
  }

  css() {
    return css;
  }

  @ready()
  onReady() {
    // Update nav if we already have placards
    if (this.placards.length > 0) {
      this.updateNav();
    }
  }

  update(_appContext: AppContext, placards: Placard[], currentRoute: string, _routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;

    // Update navigation - only if shadow DOM exists
    if (this.shadowRoot) {
      this.updateNav();
    }
  }

  updateNav() {
    if (this.navElement) {
      this.navElement.update(this.placards, this.currentRoute);
    }
  }
}
