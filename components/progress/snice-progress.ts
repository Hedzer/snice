import { element, property, watch, query, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-progress.css?inline';
import type { ProgressVariant, ProgressSize, ProgressColor, SniceProgressElement } from './snice-progress.types';

@element('snice-progress')
export class SniceProgress extends HTMLElement implements SniceProgressElement {
  @property({ type: Number,  })
  value = 0;

  @property({ type: Number,  })
  max = 100;

  @property({  })
  variant: ProgressVariant = 'linear';

  @property({  })
  size: ProgressSize = 'medium';

  @property({  })
  color: ProgressColor = 'primary';

  @property({ type: Boolean,  })
  indeterminate = false;

  @property({ type: Boolean, attribute: 'show-label',  })
  showLabel = false;

  @property({  })
  label = '';

  @property({ type: Boolean,  })
  striped = false;

  @property({ type: Boolean,  })
  animated = false;

  @property({ type: Number,  })
  thickness = 4;

  @query('.progress__bar')
  progressBar?: HTMLElement;

  @query('.progress__circle-bar')
  circleBar?: SVGCircleElement;

  @query('.progress__label')
  labelElement?: HTMLElement;

  @query('.progress__circle-label')
  circleLabelElement?: HTMLElement;

  private radius = 0;
  private circumference = 0;

  @render()
  renderContent() {
    if (this.variant === 'circular') {
      return this.renderCircular();
    }
    return this.renderLinear();
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }

  private renderLinear() {
    const percentage = this.getPercentage();
    const labelText = this.label || `${Math.round(percentage)}%`;
    const progressClass = `progress progress--linear${this.showLabel ? ' progress--with-label' : ''}`;
    const barStyle = this.indeterminate ? '' : `width: ${percentage}%`;

    return html`
      <div class="${progressClass}"
           role="progressbar"
           aria-valuenow="${this.value}"
           aria-valuemin="0"
           aria-valuemax="${this.max}"
           aria-label="${labelText}">
        <div class="progress__bar" style="${barStyle}">
          ${this.showLabel ? html`
            <span class="progress__label">${labelText}</span>
          ` : ''}
        </div>
      </div>
    `;
  }

  private renderCircular() {
    const size = this.getSizeValue();
    const strokeWidth = this.thickness;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = this.getPercentage();
    const offset = this.indeterminate ? 0 : circumference - (percentage / 100) * circumference;
    const labelText = this.label || `${Math.round(percentage)}%`;

    this.radius = radius;
    this.circumference = circumference;

    return html`
      <div class="progress progress--circular"
           role="progressbar"
           aria-valuenow="${this.value}"
           aria-valuemin="0"
           aria-valuemax="${this.max}"
           aria-label="${labelText}">
        <svg class="progress__circle" viewBox="0 0 ${size} ${size}">
          <circle
            class="progress__circle-bg"
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
          />
          <circle
            class="progress__circle-bar"
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
          />
        </svg>
        ${this.showLabel && !this.indeterminate ? html`
          <div class="progress__circle-label">${labelText}</div>
        ` : ''}
      </div>
    `;
  }

  @watch('value', 'max', 'indeterminate')
  handleProgressChange() {
    this.dispatchProgressChange();
  }

  @watch('thickness')
  handleThicknessChange() {
    if (this.variant === 'circular') {
      this.style.setProperty('--progress-spinner-stroke', `${this.thickness}px`);
    }
  }

  getPercentage(): number {
    if (this.indeterminate) return 0;
    if (this.max === 0) return 0;
    return Math.min(100, Math.max(0, (this.value / this.max) * 100));
  }

  setProgress(value: number, max?: number) {
    this.value = value;
    if (max !== undefined) {
      this.max = max;
    }
  }

  private getSizeValue(): number {
    switch (this.size) {
      case 'small': return 24;
      case 'large': return 56;
      case 'xl': return 80;
      case 'xxl': return 120;
      case 'xxxl': return 160;
      default: return 40;
    }
  }

  private dispatchProgressChange() {
    this.dispatchEvent(new CustomEvent('progress-change', {
      bubbles: true,
      composed: true,
      detail: {
        value: this.value,
        max: this.max,
        percentage: this.getPercentage(),
        indeterminate: this.indeterminate
      }
    }));
  }
}