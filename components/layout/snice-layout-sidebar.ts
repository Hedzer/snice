import { element, property, query, ready, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-sidebar.css?inline';
import '../drawer/snice-drawer.ts';
import '../nav/snice-nav.ts';
import type { SniceNav } from '../nav/snice-nav.ts';
import type { SniceDrawerElement } from '../drawer/snice-drawer.types.ts';

@element('snice-layout-sidebar')
export class SniceLayoutSidebar extends HTMLElement implements Layout {
  @property({ type: Boolean,  })
  collapsed = false;

  @query('.sidebar-drawer')
  sidebarDrawer?: SniceDrawerElement;

  @query('snice-nav')
  navElement!: SniceNav;

  private placards: Placard[] = [];
  private currentRoute = '';

  @render()
  render() {
    return html/*html*/`
      <div class="layout">
        <header class="header">
          <button class="sidebar-toggle" type="button" aria-label="Toggle sidebar" @click=${this.handleSidebarToggle}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
            </svg>
          </button>
          <div class="header-brand">
            <slot name="brand">
              <h2>App</h2>
            </slot>
          </div>
          <div class="header-content">
            <slot name="header"></slot>
          </div>
        </header>

        <div class="body-area">
          <snice-drawer class="sidebar-drawer" position="left" size="medium" contained>
            <span slot="title">Navigation</span>
            <snice-nav class="sidebar-nav" variant="hierarchical" orientation="vertical"></snice-nav>
          </snice-drawer>

          <main class="main">
            <slot name="page"></slot>
          </main>
        </div>

        <footer class="footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  handleSidebarToggle() {
    if (this.sidebarDrawer) {
      this.sidebarDrawer.toggle();
    }
  }

  @ready()
  init() {
    // Update nav when component is ready and shadow DOM is available
    this.updateNav();
  }

  update(appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;

    // Update the navigation
    this.updateNav(appContext, routeParams);
  }

  updateNav(appContext?: AppContext, routeParams?: RouteParams) {
    if (this.navElement) {
      this.navElement.update(this.placards, appContext, this.currentRoute, routeParams);
    }
  }
}
