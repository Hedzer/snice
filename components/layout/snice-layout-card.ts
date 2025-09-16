import { element, property } from 'snice';
import css from './snice-layout-card.css?inline';

@element('snice-layout-card')
export class SniceLayoutCard extends HTMLElement {
  @property({ reflect: true })
  columns: '1' | '2' | '3' | '4' | '6' = '3';
  
  @property({ reflect: true })
  gap: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  html() {
    return /*html*/`
      <div class="layout">
        <header class="header">
          <slot name="header"></slot>
        </header>
        
        <main class="main">
          <div class="grid">
            <slot></slot>
          </div>
        </main>
        
        <footer class="footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    `;
  }

  css() {
    return css;
  }
}