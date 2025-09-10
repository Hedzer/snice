import { element, property } from '../../src/index';
import css from './snice-layout-sidebar.css?inline';

@element('snice-layout-sidebar')
export class SniceLayoutSidebar extends HTMLElement {
  @property({ type: Boolean, reflect: true })
  collapsed = false;

  html() {
    return /*html*/`
      <div class="layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <slot name="brand">
              <h2>App</h2>
            </slot>
          </div>
          <nav class="sidebar-nav">
            <slot name="nav"></slot>
          </nav>
        </aside>
        
        <div class="content-area">
          <header class="header">
            <button class="sidebar-toggle" type="button" aria-label="Toggle sidebar">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
              </svg>
            </button>
            <slot name="header"></slot>
          </header>
          
          <main class="main">
            <slot></slot>
          </main>
          
          <footer class="footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    `;
  }

  css() {
    return css;
  }
}