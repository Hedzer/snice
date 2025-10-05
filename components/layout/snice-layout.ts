import { element, part, query } from 'snice';
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
          <snice-nav class="nav" part="nav" variant="flat" orientation="horizontal"></snice-nav>
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

  update(_appContext: AppContext, placards: Placard[], currentRoute: string, _routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;

    // Update navigation
    this.renderNav();
  }

  @part('nav')
  renderNav() {
    if (this.navElement) {
      this.navElement.placards = this.placards;
      this.navElement.currentRoute = this.currentRoute;
    }
    return '';
  }
}
