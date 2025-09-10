import { element } from '../../src/index';
import css from './snice-layout-dashboard.css?inline';

@element('snice-layout-dashboard')
export class SniceLayoutDashboard extends HTMLElement {
  html() {
    return /*html*/`
      <div class="layout">
        <header class="header">
          <div class="header-start">
            <slot name="brand">
              <h1>Dashboard</h1>
            </slot>
          </div>
          <div class="header-center">
            <slot name="search"></slot>
          </div>
          <div class="header-end">
            <slot name="user"></slot>
          </div>
        </header>
        
        <nav class="nav">
          <slot name="nav"></slot>
        </nav>
        
        <aside class="sidebar">
          <slot name="sidebar"></slot>
        </aside>
        
        <main class="main">
          <slot></slot>
        </main>
        
        <aside class="right-sidebar">
          <slot name="right-sidebar"></slot>
        </aside>
      </div>
    `;
  }

  css() {
    return css;
  }
}