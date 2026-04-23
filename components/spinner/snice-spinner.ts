import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-spinner.css?inline';
import type { SpinnerSize, SpinnerColor, SpinnerVariant, SniceSpinnerElement } from './snice-spinner.types';

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

  @property({  })
  variant: SpinnerVariant = 'arc';

  @render()
  render() {
    const size = this.getSizeValue();
    const strokeWidth = this.thickness;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = radius * 2 * Math.PI;
    const cx = size / 2;
    const cy = size / 2;
    const viewBox = `0 0 ${size} ${size}`;

    const shell = (content: any) => html/*html*/`
      <div part="base" class="spinner spinner--${this.variant}" role="status" aria-label="${this.label || 'Loading'}">
        ${content}
        <if ${this.label}>
          <span part="label" class="spinner__label">${this.label}</span>
        </if>
      </div>
    `;

    if (this.variant === 'dots') {
      return shell(html`
        <div part="dots" class="spinner__dots" style="--dot-size: ${Math.max(4, size / 6)}px">
          <span class="spinner__dot"></span>
          <span class="spinner__dot"></span>
          <span class="spinner__dot"></span>
        </div>
      `);
    }

    if (this.variant === 'pulse') {
      return shell(html`
        <span part="pulse" class="spinner__pulse" style="width:${size}px;height:${size}px"></span>
      `);
    }

    if (this.variant === 'bars') {
      return shell(html`
        <div part="bars" class="spinner__bars" style="--bar-height:${size}px;--bar-width:${Math.max(3, size / 10)}px">
          <span class="spinner__bar"></span>
          <span class="spinner__bar"></span>
          <span class="spinner__bar"></span>
          <span class="spinner__bar"></span>
        </div>
      `);
    }

    if (this.variant === 'orbit') {
      return shell(html`
        <div part="orbit" class="spinner__orbit" style="width:${size}px;height:${size}px">
          <span class="spinner__orbit-dot"></span>
          <span class="spinner__orbit-dot"></span>
          <span class="spinner__orbit-dot"></span>
        </div>
      `);
    }

    // Default: arc (original SVG ring)
    return shell(html`
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
    `);
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
