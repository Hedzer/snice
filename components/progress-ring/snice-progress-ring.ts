import { element, property, watch, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-progress-ring.css?inline';
import type { ProgressRingSize, SniceProgressRingElement } from './snice-progress-ring.types';

@element('snice-progress-ring')
export class SniceProgressRing extends HTMLElement implements SniceProgressRingElement {
  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 100;

  @property()
  size: ProgressRingSize = 'medium';

  @property({ type: Number })
  thickness = 4;

  @property()
  color = '';

  @property({ type: Boolean, attribute: 'show-value' })
  showValue = false;

  @property()
  label = '';

  private previousValue = 0;

  @render()
  renderContent() {
    const viewBoxSize = 36;
    const radius = (viewBoxSize - this.thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = this.max > 0 ? Math.min(100, Math.max(0, (this.value / this.max) * 100)) : 0;
    const offset = circumference - (percentage / 100) * circumference;
    const center = viewBoxSize / 2;
    const displayText = this.label || `${Math.round(percentage)}%`;
    const showCenter = this.showValue || this.label;

    return html/*html*/`
      <div class="progress-ring" part="base"
           role="progressbar"
           aria-valuenow="${this.value}"
           aria-valuemin="0"
           aria-valuemax="${this.max}"
           aria-label="${this.label || `${Math.round(percentage)}% complete`}">
        <svg class="progress-ring__svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
          <circle
            class="progress-ring__track"
            part="track"
            cx="${center}"
            cy="${center}"
            r="${radius}"
            stroke-width="${this.thickness}"
          />
          <circle
            class="progress-ring__fill"
            part="fill"
            cx="${center}"
            cy="${center}"
            r="${radius}"
            stroke-width="${this.thickness}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
          />
        </svg>
        <if ${showCenter}>
          <div class="progress-ring__center" part="center">
            <if ${this.label}>
              <span class="progress-ring__label" part="label">${this.label}</span>
            </if>
            <if ${this.showValue}>
              <span class="progress-ring__value" part="value">${Math.round(percentage)}%</span>
            </if>
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @watch('color')
  handleColorChange() {
    if (this.color) {
      this.style.setProperty('--progress-ring-color', this.color);
    } else {
      this.style.removeProperty('--progress-ring-color');
    }
  }

  @watch('value')
  handleValueChange() {
    const clamped = Math.min(this.max, Math.max(0, this.value));
    if (clamped >= this.max && this.previousValue < this.max) {
      this.emitProgressComplete();
    }
    this.previousValue = clamped;
  }

  @dispatch('progress-complete', { bubbles: true, composed: true })
  private emitProgressComplete() {
    return { value: this.value, max: this.max, component: this };
  }
}
