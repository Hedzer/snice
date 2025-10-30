import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-color-display.css?inline';
import type { ColorSwatchSize, ColorFormat, SniceColorDisplayElement } from './snice-color-display.types';

@element('snice-color-display')
export class SniceColorDisplay extends HTMLElement implements SniceColorDisplayElement {
  @property({  })
  value = '';

  @property({  })
  format: ColorFormat = 'hex';

  @property({ type: Boolean, attribute: 'show-swatch' })
  showSwatch = true;

  @property({ type: Boolean, attribute: 'show-label' })
  showLabel = true;

  @property({ attribute: 'swatch-size' })
  swatchSize: ColorSwatchSize = 'medium';

  @property({  })
  label = '';

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  render() {
    const colorValue = this.value;
    const displayText = this.getFormattedColor();
    const labelText = this.label || displayText;

    const swatchClasses = [
      'color-swatch',
      `color-swatch--${this.swatchSize}`
    ].join(' ');

    return html/*html*/`
      <div class="color-display" part="container">
        <if ${this.showSwatch}>
          <span
            class="${swatchClasses}"
            part="swatch"
            style="background-color: ${colorValue};"
          ></span>
        </if>
        <if ${this.showLabel}>
          <span class="color-label" part="label">${labelText}</span>
        </if>
      </div>
    `;
  }

  private getFormattedColor(): string {
    if (!this.value) return '';

    switch (this.format) {
      case 'hex':
        return this.value;
      case 'rgb':
        return this.hexToRgb(this.value);
      case 'hsl':
        return this.hexToHsl(this.value);
      default:
        return this.value;
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }
}
