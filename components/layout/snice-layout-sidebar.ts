import { element, property, on, query } from 'snice';
import css from './snice-layout-sidebar.css?inline';
import '../drawer/snice-drawer.ts';

@element('snice-layout-sidebar')
export class SniceLayoutSidebar extends HTMLElement {
  @property({ type: Boolean,  })
  collapsed = false;

  @query('.sidebar-drawer')
  sidebarDrawer?: HTMLElement;

  html() {
    return /*html*/`
      <div class="layout">
        <header class="header">
          <button class="sidebar-toggle" type="button" aria-label="Toggle sidebar">
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
            <nav class="sidebar-nav">
              <slot name="nav"></slot>
            </nav>
          </snice-drawer>

          <main class="main">
            <slot></slot>
          </main>
        </div>

        <footer class="footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    `;
  }

  css() {
    return css;
  }

  @on('click', '.sidebar-toggle')
  handleSidebarToggle() {
    if (this.sidebarDrawer && 'toggle' in this.sidebarDrawer) {
      (this.sidebarDrawer as any).toggle();
    }
  }
}