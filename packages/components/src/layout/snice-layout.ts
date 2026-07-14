import { element, query, ready, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout.css?inline';
import '../nav/snice-nav.ts';
import type { SniceNav } from '../nav/snice-nav.ts';

@element('snice-layout')
export class SniceLayout extends HTMLElement implements Layout {
  @query('snice-nav')
  navElement!: SniceNav;

  private placards: Placard[] = [];
  private currentRoute = '';

  @render()
  render() {
    return html/*html*/`
      <div class="layout" part="base">
        <header class="header" part="header">
          <div class="brand" part="brand">
            <slot name="brand">
              <h1>App</h1>
            </slot>
          </div>
          <snice-nav class="nav" variant="flat" orientation="horizontal"></snice-nav>
        </header>

        <main class="main" part="main">
          <slot name="page"></slot>
        </main>

        <footer class="footer" part="footer">
          <slot name="footer">
          </slot>
        </footer>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  onReady() {
    // Update nav if we already have placards
    if (this.placards.length > 0) {
      this.updateNav();
    }
  }

  update(appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;

    // Update navigation - only if shadow DOM exists
    if (this.shadowRoot) {
      this.updateNav(appContext, routeParams);
    }
  }

  updateNav(appContext?: AppContext, routeParams?: RouteParams) {
    if (this.navElement) {
      this.navElement.update(this.placards, appContext, this.currentRoute, routeParams);
    }
  }
}
