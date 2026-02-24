import { element, property, render, styles, html, css, watch, query, observe } from 'snice';
import type { TimeSeriesPoint } from '../types/app';

@element('bar-chart')
export class BarChart extends HTMLElement {
  @property() title = '';
  @property({ type: Array }) data: TimeSeriesPoint[] = [];

  @query('.chart-canvas') $canvas?: HTMLCanvasElement;
  @query('.chart-container') $container?: HTMLDivElement;

  private canvasWidth = 600;
  private canvasHeight = 200;

  @render({ once: true })
  template() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">${this.title}</h3>
        </div>
        <div class="chart-container">
          <canvas class="chart-canvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
        </div>
      </div>
    `;
  }

  @observe('resize', '.chart-container')
  handleResize(entries: ResizeObserverEntry[]) {
    const entry = entries[0];
    if (!entry) return;
    const { width } = entry.contentRect;
    if (width > 0) {
      this.canvasWidth = Math.floor(width);
      this.canvasHeight = Math.floor(Math.min(width * 0.4, 280));
      this.drawChart();
    }
  }

  @watch('data')
  onDataChange() {
    this.drawChart();
  }

  private drawChart() {
    if (!this.$canvas) return;
    const canvas = this.$canvas;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = this.canvasWidth * dpr;
    canvas.height = this.canvasHeight * dpr;
    canvas.style.width = this.canvasWidth + 'px';
    canvas.style.height = this.canvasHeight + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx || this.data.length === 0) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const w = this.canvasWidth - padding.left - padding.right;
    const h = this.canvasHeight - padding.top - padding.bottom;

    const values = this.data.map((d) => d.value);
    const maxVal = Math.max(...values) * 1.1;
    const minVal = Math.min(...values) * 0.9;
    const range = maxVal - minVal;

    // Grid lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (h * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + w, y);
      ctx.stroke();

      // Y-axis labels
      const val = maxVal - (range * i) / gridLines;
      ctx.fillStyle = '#64748b';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(val).toLocaleString(), padding.left - 8, y + 4);
    }

    // Area + line
    const barWidth = w / this.data.length;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + h);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + h);
    this.data.forEach((d, i) => {
      const x = padding.left + i * barWidth + barWidth / 2;
      const y = padding.top + h - ((d.value - minVal) / range) * h;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + (this.data.length - 1) * barWidth + barWidth / 2, padding.top + h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    this.data.forEach((d, i) => {
      const x = padding.left + i * barWidth + barWidth / 2;
      const y = padding.top + h - ((d.value - minVal) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // X-axis labels (every nth)
    const labelInterval = Math.max(1, Math.floor(this.data.length / 6));
    ctx.fillStyle = '#64748b';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    this.data.forEach((d, i) => {
      if (i % labelInterval === 0 || i === this.data.length - 1) {
        const x = padding.left + i * barWidth + barWidth / 2;
        const parts = d.date.split('-');
        ctx.fillText(parts[1] + '/' + parts[2], x, padding.top + h + 18);
      }
    });
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
      }

      .panel {
        background: var(--dash-surface, #1e293b);
        border: 1px solid var(--dash-border, #334155);
        border-radius: var(--dash-radius-lg, 12px);
        overflow: hidden;
      }

      .panel-header {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--dash-border, #334155);
      }

      .panel-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--dash-text, #f1f5f9);
        margin: 0;
      }

      .chart-container {
        padding: 1rem;
        min-height: 160px;
      }

      .chart-canvas {
        display: block;
        width: 100%;
      }
    `;
  }
}
