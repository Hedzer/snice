import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-layout-centered.css?inline';

@element('snice-layout-centered')
export class SniceLayoutCentered extends HTMLElement {
  @property({  })
  width: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  @render()
  renderContent() {
    return html/*html*/`
      <div class="layout">
        <div class="container">
          <slot name="page"></slot>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}