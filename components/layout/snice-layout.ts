import { element } from 'snice';
import css from './snice-layout.css?inline';

@element('snice-layout')
export class SniceLayout extends HTMLElement {
  html() {
    return /*html*/`
      <div class="layout">
        <header class="header">
          <div class="brand">
            <slot name="brand">
              <h1>App</h1>
            </slot>
          </div>
          <nav class="nav">
            <slot name="nav"></slot>
          </nav>
        </header>
        
        <main class="main">
          <slot></slot>
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
}