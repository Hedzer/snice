import { element, property, watch, ready, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-image.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-image')
export class SniceCellImage extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  value: string = '';

  @property({ type: String })
  src: string = '';

  @property({ type: String })
  alt: string = '';

  @property({ type: String })
  fallback: string = '';

  @property({ type: String })
  variant: 'rounded' | 'square' | 'circle' = 'rounded';

  @property({ type: String })
  size: 'small' | 'medium' | 'large' = 'medium';

  @property({ type: Boolean })
  lazy: boolean = true;

  @property({ type: Object })
  column: ColumnDefinition | null = null;

  @property({ type: Object })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'center';

  @property({ type: String })
  type: string = 'image';

  @property({ type: Boolean })
  imageError: boolean = false;

  @render()
  renderContent() {
    const imageSrc = this.src || this.value;
    const imageAlt = this.alt || 'Image';
    const loadingAttr = this.lazy ? 'lazy' : 'eager';
    const variantClass = `image--${this.variant}`;
    const sizeClass = `image--${this.size}`;

    const imageHTML = this.imageError && this.fallback
      ? `<img src="${this.fallback}" alt="${imageAlt}" class="cell-image ${variantClass} ${sizeClass}" />`
      : imageSrc
      ? `<img src="${imageSrc}" alt="${imageAlt}" loading="${loadingAttr}" class="cell-image ${variantClass} ${sizeClass}" @error=${this.handleImageError} />`
      : `<div class="cell-image cell-image--placeholder ${variantClass} ${sizeClass}"></div>`;

    return html/*html*/`
      <div class="cell-content cell-content--image" part="content">
        ${unsafeHTML(imageHTML)}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.updateImageAttributes();
  }

  @watch('value', 'column')
  updateImageAttributes() {
    if (this.column?.imageFormat) {
      const format = this.column.imageFormat;
      this.src = format.src || this.value;
      this.alt = format.alt || '';
      this.fallback = format.fallback || '';
      this.variant = format.variant || 'rounded';
      this.size = format.size || 'medium';
      this.lazy = format.lazy ?? true;
    }
  }

  private handleImageError() {
    this.imageError = true;
  }
}
