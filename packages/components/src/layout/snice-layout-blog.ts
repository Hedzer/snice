import { element, query, property, ready, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-blog.css?inline';
import '../nav/snice-nav.ts';
import type { SniceNav } from '../nav/snice-nav.ts';

@element('snice-layout-blog')
export class SniceLayoutBlog extends HTMLElement implements Layout {
  @query('snice-nav')
  navElement?: SniceNav;

  @property({ type: Boolean, attribute: 'use-nav' })
  useNav = false;

  @property({ attribute: false })
  hasSidebar = false;

  /** Size to the parent element instead of filling the screen. */
  @property({ type: Boolean })
  contained = false;

  private placards: Placard[] = [];
  private currentRoute = '';

  @render()
  render() {
    return html/*html*/`
      <div class="layout" part="base">
        <header class="header" part="header">
          <div class="container" part="container header-container">
            <div class="brand" part="brand">
              <slot name="brand">
                <h1 part="brand-fallback">Blog</h1>
              </slot>
            </div>
            <nav class="nav" part="nav-area">
              <slot name="nav">
                <if ${this.useNav}>
                  <snice-nav part="nav" exportparts="base: nav-base, nav: nav-nav, group: nav-group, group-label: nav-group-label, submenu: nav-submenu, item: nav-item, link: nav-link, icon: nav-icon, label: nav-label, item-active: nav-item-active, group-active: nav-group-active, link-active: nav-link-active" variant="flat" orientation="horizontal"></snice-nav>
                </if>
              </slot>
            </nav>
          </div>
        </header>

        <main class="main" part="main">
          <div class="container" part="container main-container">
            <div class="content-area${this.hasSidebar ? ' content-area--with-sidebar' : ''}" part="content${this.hasSidebar ? ' content-with-sidebar' : ''}">
              <article class="article" part="article">
                <slot name="page"></slot>
              </article>

              <aside class="sidebar${this.hasSidebar ? '' : ' sidebar--empty'}" part="sidebar${this.hasSidebar ? '' : ' sidebar-empty'}">
                <slot name="sidebar"></slot>
              </aside>
            </div>
          </div>
        </main>

        <footer class="footer" part="footer">
          <div class="container" part="container footer-container">
            <slot name="footer"></slot>
          </div>
        </footer>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  wireSlotDetection() {
    this.syncSlotState();
    this.shadowRoot?.addEventListener('slotchange', () => this.syncSlotState());
  }

  private syncSlotState() {
    this.hasSidebar = !!this.querySelector('[slot="sidebar"]');
  }

  update(appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;
    this.useNav = true;

    this.updateNav(appContext, routeParams);
  }

  updateNav(appContext?: AppContext, routeParams?: RouteParams) {
    if (this.navElement) {
      this.navElement.update(this.placards, appContext, this.currentRoute, routeParams);
    }
  }
}