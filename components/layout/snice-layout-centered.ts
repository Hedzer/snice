import { element, property } from 'snice';
import css from './snice-layout-centered.css?inline';

@element('snice-layout-centered')
export class SniceLayoutCentered extends HTMLElement {
  @property({  })
  width: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  html() {
    return /*html*/`
      <div class="layout">
        <div class="container">
          <slot name="page"></slot>
        </div>
      </div>
    `;
  }

  css() {
    return css;
  }
}