import { element } from '../../src/index';
import css from './snice-layout-blog.css?inline';

@element('snice-layout-blog')
export class SniceLayoutBlog extends HTMLElement {
  html() {
    return /*html*/`
      <div class="layout">
        <header class="header">
          <div class="container">
            <div class="brand">
              <slot name="brand">
                <h1>Blog</h1>
              </slot>
            </div>
            <nav class="nav">
              <slot name="nav"></slot>
            </nav>
          </div>
        </header>
        
        <main class="main">
          <div class="container">
            <div class="content-area">
              <article class="article">
                <slot></slot>
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

  css() {
    return css;
  }
}