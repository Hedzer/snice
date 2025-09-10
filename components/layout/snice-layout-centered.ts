import { element, property } from '../../src/index';
import css from './snice-layout-centered.css?inline';

@element('snice-layout-centered')
export class SniceLayoutCentered extends HTMLElement {
  @property({ reflect: true })
  width: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  html() {
    return /*html*/`
      <div class="layout">
        <div class="container">
          <slot></slot>
        </div>
      </div>
    `;
  }

  css() {
    return css;
  }
}