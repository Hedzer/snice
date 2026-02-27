import { element, property, render, styles, html, css, watch, ready } from 'snice';
import cssContent from './snice-gauge.css?inline';
import type { GaugeVariant, GaugeSize, SniceGaugeElement } from './snice-gauge.types';

@element('snice-gauge')
export class SniceGauge extends HTMLElement implements SniceGaugeElement {
  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max = 100;

  @property()
  label = '';

  @property()
  variant: GaugeVariant = 'default';

  @property()
  size: GaugeSize = 'medium';

  @property({ type: Boolean })
  showValue = true;

  @property({ type: Number })
  thickness = 8;

  private getPercentage(): number {
    const range = this.max - this.min;
    if (range <= 0) return 0;
    const clamped = Math.max(this.min, Math.min(this.max, this.value));
    return (clamped - this.min) / range;
  }

  private getArcPath(radius: number): string {
    const cx = 60;
    const cy = 55;
    const startX = cx - radius;
    const startY = cy;
    const endX = cx + radius;
    const endY = cy;
    return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  }

  @render()
  renderContent() {
    const radius = 45;
    const arcPath = this.getArcPath(radius);
    const arcLength = Math.PI * radius;
    const percentage = this.getPercentage();
    const fillOffset = arcLength * (1 - percentage);
    const displayValue = Math.round(this.value);
    const hasLabel = this.label !== '';

    return html/*html*/`
      <div part="base" class="gauge" role="meter"
           aria-valuenow="${this.value}"
           aria-valuemin="${this.min}"
           aria-valuemax="${this.max}"
           aria-label="${this.label || `Gauge: ${displayValue}`}">
        <div class="gauge__chart">
          <svg class="gauge__svg" viewBox="0 0 120 70">
            <path class="gauge__track"
                  d="${arcPath}"
                  stroke-width="${this.thickness}"
                  fill="none" />
            <path class="gauge__fill"
                  d="${arcPath}"
                  stroke-width="${this.thickness}"
                  fill="none"
                  stroke-dasharray="${arcLength}"
                  stroke-dashoffset="${fillOffset}" />
          </svg>
          <if ${this.showValue}>
            <span part="value" class="gauge__value-text">${displayValue}</span>
          </if>
        </div>
        <if ${hasLabel}>
          <span part="label" class="gauge__label">${this.label}</span>
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
