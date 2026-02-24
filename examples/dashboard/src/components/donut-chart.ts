import { element, property, render, styles, html, css, watch, query, observe } from 'snice';
import type { ChartDataPoint } from '../types/app';

@element('donut-chart')
export class DonutChart extends HTMLElement {
  @property() title = '';
  @property({ type: Array }) data: ChartDataPoint[] = [];

  @query('.chart-canvas') $canvas?: HTMLCanvasElement;

  private canvasSize = 200;

  @render({ once: true })
  template() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">${this.title}</h3>
        </div>
        <div class="chart-body">
          <div class="chart-container">
            <canvas class="chart-canvas" width="${this.canvasSize}" height="${this.canvasSize}"></canvas>
          </div>
          <div class="legend">
            ${this.data.map(
              (d) => html`
                <div class="legend-item" key=${d.label}>
                  <span class="legend-dot" style="background:${d.color || '#6366f1'}"></span>
                  <span class="legend-label">${d.label}</span>
                  <span class="legend-value">${d.value}%</span>
                </div>
              `
            )}
          </div>
        </div>
      </div>
    `;
  }

  @observe('resize', '.chart-container')
  handleResize(entries: ResizeObserverEntry[]) {
    const entry = entries[0];
    if (!entry) return;
    const size = Math.min(entry.contentRect.width, entry.contentRect.height);
    if (size > 0) {
      this.canvasSize = Math.floor(size);
      this.drawChart();
    }
  }

  @watch('data')
  onDataChange() {
    this.drawLegend();
    this.drawChart();
  }

  private drawLegend() {
    if (!this.shadowRoot) return;
    const legend = this.shadowRoot.querySelector('.legend');
    if (!legend) return;
    legend.innerHTML = '';
    this.data.forEach((d) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <span class="legend-dot" style="background:${d.color || '#6366f1'}"></span>
        <span class="legend-label">${d.label}</span>
        <span class="legend-value">${d.value}%</span>
      `;
      legend.appendChild(item);
    });
  }

  private drawChart() {
    if (!this.$canvas || this.data.length === 0) return;
    const canvas = this.$canvas;
    const dpr = window.devicePixelRatio || 1;
    const size = this.canvasSize;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;
    const innerRadius = radius * 0.6;
    const total = this.data.reduce((s, d) => s + d.value, 0);

    let startAngle = -Math.PI / 2;
    this.data.forEach((d) => {
      const slice = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
      ctx.arc(cx, cy, innerRadius, startAngle + slice, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = d.color || '#6366f1';
      ctx.fill();
      startAngle += slice;
    });

    // Center text
    ctx.fillStyle = '#f1f5f9';
    ctx.font = `bold ${Math.round(size * 0.1)}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total + '%', cx, cy - 6);
    ctx.font = `${Math.round(size * 0.06)}px -apple-system, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Total', cx, cy + 12);
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

      .chart-body {
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .chart-container {
        width: 160px;
        height: 160px;
        flex-shrink: 0;
      }

      .chart-canvas {
        display: block;
      }

      .legend {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .legend-label {
        color: var(--dash-text-secondary, #94a3b8);
        flex: 1;
      }

      .legend-value {
        color: var(--dash-text, #f1f5f9);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
    `;
  }
}
