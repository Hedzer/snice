import { element, property, watch, ready, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-color.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-color')
export class SniceCellColor extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  value: string = '';

  @property({ type: String })
  color: string = '';

  @property({ type: Boolean })
  showSwatch: boolean = true;

  @property({ type: Boolean })
  showHex: boolean = true;

  @property({ type: Boolean })
  showRgb: boolean = false;

  @property({ type: String })
  swatchSize: 'small' | 'medium' | 'large' = 'medium';

  @property({ type: Object })
  column: ColumnDefinition | null = null;

  @property({ type: Object })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'color';

  @render()
  renderContent() {
    const colorValue = this.color || this.value;
    const swatchHTML = this.showSwatch
      ? `<span class="color-swatch color-swatch--${this.swatchSize}" style="background-color: ${colorValue};"></span>`
      : '';

    let textDisplay = '';
    if (this.showHex) {
      textDisplay = colorValue;
    }
    if (this.showRgb && colorValue.startsWith('#')) {
      const rgb = this.hexToRgb(colorValue);
      textDisplay = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : colorValue;
    }

    return html/*html*/`
      <div class="cell-content cell-content--color" part="content">
        ${unsafeHTML(swatchHTML)}
        ${textDisplay ? html`<span class="color-text">${textDisplay}</span>` : ''}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.updateColorAttributes();
  }

  @watch('value', 'column')
  updateColorAttributes() {
    if (this.column?.colorFormat) {
      const format = this.column.colorFormat;
      this.color = format.color || this.value;
      this.showSwatch = format.showSwatch ?? true;
      this.showHex = format.showHex ?? true;
      this.showRgb = format.showRgb ?? false;
      this.swatchSize = format.swatchSize || 'medium';
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }
}
