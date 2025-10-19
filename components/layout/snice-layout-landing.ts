import { element, query, property, render, styles, html, watch } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-landing.css?inline';
import '../nav/snice-nav.ts';
import type { SniceNav } from '../nav/snice-nav.ts';

@element('snice-layout-landing')
export class SniceLayoutLanding extends HTMLElement implements Layout {
  @query('snice-nav')
  navElement?: SniceNav;

  @property({ type: Boolean, attribute: 'use-nav' })
  useNav = false;

  private placards: Placard[] = [];
  private currentRoute = '';

  @render()
  renderContent() {
    return html`
      <div class="layout">
        <header class="header">
          <div class="container">
            <div class="brand">
              <slot name="brand">
                <h1>Brand</h1>
              </slot>
            </div>
            ${this.useNav ? html`
              <snice-nav class="nav" variant="flat" orientation="horizontal"></snice-nav>
            ` : html`
              <nav class="nav">
                <slot name="nav"></slot>
              </nav>
            `}
            <div class="cta">
              <slot name="cta"></slot>
            </div>
          </div>
        </header>

        <main class="main">
          <section class="hero">
            <slot name="hero"></slot>
          </section>

          <div class="content">
            <slot name="page"></slot>
          </div>
        </main>

        <footer class="footer">
          <div class="container">
            <slot name="footer"></slot>
          </div>
        </footer>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssContent;
  }

  update(_appContext: AppContext, placards: Placard[], currentRoute: string, _routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;
    this.useNav = true;

    this.updateNav();
  }

  @watch('placards', 'currentRoute')
  updateNav() {
    if (this.navElement) {
      this.navElement.placards = this.placards;
      this.navElement.currentRoute = this.currentRoute;
    }
  }
}