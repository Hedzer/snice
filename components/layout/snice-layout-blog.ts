import { element, query, property, render, styles, html, css } from 'snice';
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
            <if ${this.useNav}>
              <snice-nav class="nav" variant="flat" orientation="horizontal"></snice-nav>
            </if>
            <if ${!this.useNav}>
              <nav class="nav">
                <slot name="nav"></slot>
              </nav>
            </if>
          </div>
        </header>

        <main class="main">
          <div class="container">
            <div class="content-area">
              <article class="article">
                <slot name="page"></slot>
              </article>

              <aside class="sidebar">
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