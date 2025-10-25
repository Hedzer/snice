import { element, property, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-sparkline.css?inline';
import type { SparklineType, SparklineColor, SniceSparklineElement } from './snice-sparkline.types';

@element('snice-sparkline')
export class SniceSparkline extends HTMLElement implements SniceSparklineElement {
  @property({ type: Array })
  data: number[] = [];

  @property({  })
  type: SparklineType = 'line';

  @property({  })
  color: SparklineColor = 'primary';

  @property({  })
  customColor?: string;

  @property({ type: Number })
  width = 100;

  @property({ type: Number })
  height = 30;

  @property({ type: Number })
  strokeWidth = 2;

  @property({ type: Boolean })
  showDots = false;

  @property({ type: Boolean })
  showArea = false;

  @property({ type: Boolean })
  smooth = false;

  @property({ type: Number })
  min?: number;

  @property({ type: Number })
  max?: number;

  @styles()
  get componentStyles() {
    return css`${cssContent}`;
  }

  private getMinMax(): { min: number; max: number } {
    if (this.data.length === 0) {
      return { min: 0, max: 100 };
    }

    const dataMin = Math.min(...this.data);
    const dataMax = Math.max(...this.data);

    return {
      min: this.min !== undefined ? this.min : dataMin,
      max: this.max !== undefined ? this.max : dataMax
    };
  }

  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return (value - min) / (max - min);
  }

  private getSmoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
    }

    const tension = 0.3;
    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
  }

  private buildSVGString(): string {
    if (this.data.length === 0) {
      return `<svg class="sparkline__svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" part="svg"></svg>`;
    }

    const { min, max } = this.getMinMax();

    // Calculate padding to prevent clipping
    // Bars don't need stroke padding, just minimal padding for anti-aliasing
    let padding: number;
    if (this.type === 'bar') {
      padding = 1;
    } else {
      padding = this.showDots ? this.strokeWidth + 2 : this.strokeWidth + 1;
    }

    const drawWidth = this.width - (padding * 2);
    const drawHeight = this.height - (padding * 2);

    let svgContent = '';

    if (this.type === 'bar') {
      const barWidth = drawWidth / this.data.length;
      const gap = barWidth * 0.2;
      const actualBarWidth = barWidth - gap;

      const bars = this.data.map((value, index) => {
        const normalizedValue = this.normalize(value, min, max);
        const barHeight = normalizedValue * drawHeight;
        const x = padding + (index * barWidth) + gap / 2;
        const y = padding + drawHeight - barHeight;
        return `<rect class="sparkline__bar" x="${x}" y="${y}" width="${actualBarWidth}" height="${barHeight}" part="bar"/>`;
      }).join('');

      svgContent = bars;
    } else {
      // line or area type
      const pointsArray = this.data.map((value, index) => {
        const x = padding + (index / (this.data.length - 1)) * drawWidth;
        const y = padding + drawHeight - this.normalize(value, min, max) * drawHeight;
        return { x, y };
      });

      const shouldShowArea = this.showArea || this.type === 'area';

      let elements = '';

      if (this.smooth) {
        const pathData = this.getSmoothPath(pointsArray);

        if (shouldShowArea) {
          const areaPath = `${pathData} L ${padding + drawWidth},${padding + drawHeight} L ${padding},${padding + drawHeight} Z`;
          elements += `<path class="sparkline__area" d="${areaPath}" part="area"/>`;
        }

        elements += `<path class="sparkline__line" d="${pathData}" stroke-width="${this.strokeWidth}" part="line"/>`;
      } else {
        const points = pointsArray.map(p => `${p.x},${p.y}`).join(' ');

        if (shouldShowArea) {
          const areaPoints = `${padding},${padding + drawHeight} ${points} ${padding + drawWidth},${padding + drawHeight}`;
          elements += `<polygon class="sparkline__area" points="${areaPoints}" part="area"/>`;
        }

        elements += `<polyline class="sparkline__line" points="${points}" stroke-width="${this.strokeWidth}" part="line"/>`;
      }

      if (this.showDots) {
        const dots = pointsArray.map(p => {
          return `<circle class="sparkline__dot" cx="${p.x}" cy="${p.y}" r="${this.strokeWidth}" stroke-width="${this.strokeWidth / 2}" part="dot"/>`;
        }).join('');
        elements += dots;
      }

      svgContent = elements;
    }

    return `<svg class="sparkline__svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" part="svg">${svgContent}</svg>`;
  }

  @render()
  renderContent() {
    const containerClasses = [
      'sparkline',
      this.customColor ? 'sparkline--custom' : `sparkline--${this.color}`
    ].join(' ');

    const customStyle = this.customColor ? `
      --sparkline-custom-color: ${this.customColor};
    ` : '';

    return html`
      <div class="${containerClasses}" part="container" style="${customStyle}">
        ${unsafeHTML(this.buildSVGString())}
      </div>
    `;
  }
}
