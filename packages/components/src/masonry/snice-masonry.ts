import { element, property, watch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-masonry.css?inline';
import type { SniceMasonryElement } from './snice-masonry.types';

@element('snice-masonry')
export class SniceMasonry extends HTMLElement implements SniceMasonryElement {
  @property({ type: Number })
  columns = 3;

  @property()
  gap = '1rem';

  @property({ attribute: 'min-column-width' })
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

    queueMicrotask(() => this.applyListItemRoles());
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    slot?.addEventListener('slotchange', () => this.applyListItemRoles());
  }

  private applyListItemRoles() {
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    const items = slot?.assignedElements({ flatten: true }) ?? [];
    for (const el of items) {
      if (!(el as HTMLElement).hasAttribute('role') && (el as HTMLElement).tagName !== 'LI') {
        (el as HTMLElement).setAttribute('role', 'listitem');
      }
    }
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
