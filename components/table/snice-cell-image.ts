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
    const classes = `cell-image ${variantClass} ${sizeClass}`;

    if (this.imageError && this.fallback) {
      return html/*html*/`
        <div class="cell-content cell-content--image" part="content">
          <img src="${this.fallback}" alt="${imageAlt}" class="${classes}" />
        </div>
      `;
    }

    if (imageSrc) {
      return html/*html*/`
        <div class="cell-content cell-content--image" part="content">
          <img src="${imageSrc}" alt="${imageAlt}" loading="${loadingAttr}" class="${classes}" @error=${this.handleImageError} />
        </div>
      `;
    }

    return html/*html*/`
      <div class="cell-content cell-content--image" part="content">
        <div class="${classes} cell-image--placeholder"></div>
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

  @watch('column')
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
