import { element, property, watch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-masonry.css?inline';
import type { SniceMasonryElement } from './snice-masonry.types';

@element('snice-masonry')
export class SniceMasonry extends HTMLElement implements SniceMasonryElement {
  @property({ type: Number })
  columns = 3;

  @property()
  gap = '1rem';

  @property()
  minColumnWidth = '250px';

  @render()
  renderContent() {
    return html/*html*/`
      <div class="masonry" part="base" role="list">
        <slot></slot>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.updateColumns();
    this.updateGap();
    this.updateColumnWidth();
  }

  @watch('columns')
  updateColumns() {
    this.style.setProperty('--masonry-columns', String(this.columns));
  }

  @watch('gap')
  updateGap() {
    this.style.setProperty('--masonry-gap', this.gap);
  }

  @watch('minColumnWidth')
  updateColumnWidth() {
    this.style.setProperty('--masonry-column-width', this.minColumnWidth);
  }
}
