import { element } from 'snice';
import css from './snice-layout-landing.css?inline';

@element('snice-layout-landing')
export class SniceLayoutLanding extends HTMLElement {
  html() {
    return /*html*/`
      <div class="layout">
        <header class="header">
          <div class="container">
            <div class="brand">
              <slot name="brand">
                <h1>Brand</h1>
              </slot>
            </div>
            <nav class="nav">
              <slot name="nav"></slot>
            </nav>
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
            <slot></slot>
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

  css() {
    return css;
  }
}