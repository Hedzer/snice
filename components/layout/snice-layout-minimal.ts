import { element } from '../../src/index';
import css from './snice-layout-minimal.css?inline';

@element('snice-layout-minimal')
export class SniceLayoutMinimal extends HTMLElement {
  html() {
    return /*html*/`
      <div class="layout">
        <main class="main">
          <slot></slot>
        </main>
      </div>
    `;
  }

  css() {
    return css;
  }
}