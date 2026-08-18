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
      <div class="layout">
        <header class="header">
          <div class="container">
            <div class="brand">
              <slot name="brand">
                <h1>Blog</h1>
              </slot>
            </div>
            <nav class="nav">
              <slot name="nav">
                <if ${this.useNav}>
                  <snice-nav variant="flat" orientation="horizontal"></snice-nav>
                </if>
              </slot>
            </nav>
          </div>
        </header>

        <main class="main">
          <div class="container">
            <div class="content-area${this.hasSidebar ? ' content-area--with-sidebar' : ''}">
              <article class="article">
                <slot name="page"></slot>
              </article>

              <aside class="sidebar${this.hasSidebar ? '' : ' sidebar--empty'}">
                <slot name="sidebar"></slot>
              </aside>
            </div>
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