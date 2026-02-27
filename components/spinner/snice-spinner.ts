import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-spinner.css?inline';
import type { SpinnerSize, SpinnerColor, SniceSpinnerElement } from './snice-spinner.types';

@element('snice-spinner')
export class SniceSpinner extends HTMLElement implements SniceSpinnerElement {
  @property({  })
  size: SpinnerSize = 'medium';

  @property({  })
  color: SpinnerColor = 'primary';

  @property({  })
  label = '';

  @property({ type: Number,  })
  thickness = 4;

  @render()
  render() {
    const size = this.getSizeValue();
    const strokeWidth = this.thickness;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = radius * 2 * Math.PI;
    const cx = size / 2;
    const cy = size / 2;
    const viewBox = `0 0 ${size} ${size}`;

    return html/*html*/`
      <div part="base" class="spinner" role="status" aria-label="${this.label || 'Loading'}">
        <svg
          part="circle"
          class="spinner__circle"
          viewBox="${viewBox}"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            class="spinner__circle-bg"
            cx="${cx}"
            cy="${cy}"
            r="${radius}"
          ></circle>
          <circle
            class="spinner__circle-bar"
            cx="${cx}"
            cy="${cy}"
            r="${radius}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="0"
          ></circle>
        </svg>
        <if ${this.label}>
          <span part="label" class="spinner__label">${this.label}</span>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private getSizeValue(): number {
    switch (this.size) {
      case 'small': return 24;
      case 'medium': return 40;
      case 'large': return 56;
      case 'xl': return 80;
      default: return 40;
    }
  }
}
