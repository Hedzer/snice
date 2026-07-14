import { element, property, watch, ready, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-color.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';
import { installCellPresentation } from './table-cell-presentation';

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

  @property({ type: Object, attribute: false })
  column: ColumnDefinition | null = null;

  @property({ type: Object, attribute: false })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'color';

  @render()
  render() {
    const colorValue = this.color || this.value;
    const swatchHTML = this.showSwatch
      ? `<span class="color-swatch color-swatch--${this.swatchSize}" style="background-color: ${colorValue};"></span>`
      : '';

    const textDisplay = this.getDisplayText(colorValue);

    return html/*html*/`
      <div class="cell-content cell-content--color" part="content">
        ${unsafeHTML(swatchHTML)}
        ${textDisplay ? html`<span class="color-text">${textDisplay}</span>` : ''}
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    installCellPresentation(this, true);
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
      this.swatchSize = format.swatchSize || format.size || 'medium';
    }
  }

  private getDisplayText(colorValue: string): string {
    const display = this.column?.colorFormat?.displayFormat;
    if (display === 'name') return this.value || colorValue;
    if (display === 'rgb') {
      const rgb = this.hexToRgb(colorValue);
      return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : colorValue;
    }
    if (display === 'hsl') {
      const rgb = this.hexToRgb(colorValue);
      if (!rgb) return colorValue;
      const { h, s, l } = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    if (display === 'hex') return colorValue;
    if (this.showRgb && colorValue.startsWith('#')) {
      const rgb = this.hexToRgb(colorValue);
      return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : colorValue;
    }
    return this.showHex ? colorValue : '';
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

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    if (delta) {
      if (max === rn) h = ((gn - bn) / delta) % 6;
      else if (max === gn) h = (bn - rn) / delta + 2;
      else h = (rn - gn) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
}
