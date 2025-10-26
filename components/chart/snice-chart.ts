import { element, property, render, styles, dispatch, html, css } from 'snice';
import type { ChartType, ChartDataset, ChartOptions, ChartDataPoint, SniceChartElement } from './snice-chart.types';
import chartStyles from './snice-chart.css?inline';

const DEFAULT_OPTIONS: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  legend: { position: 'top', clickable: true },
  tooltip: { trigger: 'hover' },
  animation: { enabled: true, duration: 500, easing: 'ease-out' },
  xAxis: { grid: true },
  yAxis: { grid: true }
};

const DEFAULT_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0',
  '#00bcd4', '#8bc34a', '#ffc107', '#e91e63', '#673ab7'
];

@element('snice-chart')
export class SniceChart extends HTMLElement implements SniceChartElement {
  @property({ type: String })
  type: ChartType = 'line';

  @property({ type: Array, attribute: false })
  datasets: ChartDataset[] = [];

  @property({ type: Array, attribute: false })
  labels: string[] = [];

  @property({ type: Object, attribute: false })
  options: ChartOptions = DEFAULT_OPTIONS;

  @property({ type: Number })
  width: number = 0;

  @property({ type: Number })
  height: number = 0;

  private hiddenDatasets: Set<number> = new Set();
  private tooltipVisible: boolean = false;
  private tooltipContent: string = '';
  private tooltipX: number = 0;
  private tooltipY: number = 0;

  @styles()
  styles() {
    return css/*css*/`${chartStyles}`;
  }

  @render()
  render() {
    const legendPosition = this.options.legend?.position || 'top';
    const animated = this.options.animation?.enabled !== false;

    return html`
      <div class="chart-container ${animated ? 'animated' : ''}">
        ${legendPosition !== 'none' ? this.renderLegend() : ''}
        <div class="chart-canvas">
          ${this.renderChart()}
        </div>
        <div class="chart-tooltip ${this.tooltipVisible ? 'visible' : ''}"
             style="left: ${this.tooltipX}px; top: ${this.tooltipY}px;">
          ${this.tooltipContent}
        </div>
      </div>
    `;
  }

  private renderLegend() {
    const position = this.options.legend?.position || 'top';
    return html`
      <div class="chart-legend legend-${position}">
        ${this.datasets.map((dataset, index) => html`
          <div class="legend-item ${this.hiddenDatasets.has(index) ? 'hidden' : ''}"
               @click=${() => this.handleLegendClick(index)}>
            <div class="legend-color" style="background: ${this.getDatasetColor(dataset, index)};"></div>
            <span class="legend-label">${dataset.label}</span>
          </div>
        `)}
      </div>
    `;
  }

  private renderChart() {
    if (!this.datasets.length) {
      return html`<svg></svg>`;
    }

    const chartType = this.type;

    switch (chartType) {
      case 'pie':
      case 'donut':
        return this.renderPieChart(chartType === 'donut');
      case 'radar':
        return this.renderRadarChart();
      case 'horizontal-bar':
        return this.renderBarChart(true);
      default:
        return this.renderCartesianChart();
    }
  }

  private renderCartesianChart() {
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = this.width || this.offsetWidth || 600;
    const height = this.height || this.offsetHeight || 400;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const { min: yMin, max: yMax } = this.getYAxisRange();
    const xCount = this.getXAxisCount();

    return html`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${this.renderCartesianGrid(padding, chartWidth, chartHeight, yMin, yMax, xCount)}
        ${this.renderCartesianAxes(padding, chartWidth, chartHeight, yMin, yMax, xCount)}
        <g transform="translate(${padding.left}, ${padding.top})">
          ${this.datasets.map((dataset, index) =>
            this.hiddenDatasets.has(index) ? '' :
            this.renderDataset(dataset, index, chartWidth, chartHeight, yMin, yMax, xCount)
          )}
        </g>
      </svg>
    `;
  }

  private renderCartesianGrid(padding: any, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number) {
    if (!this.options.xAxis?.grid && !this.options.yAxis?.grid) return '';

    const yTicks = this.options.yAxis?.ticks || 5;
    const gridLines = [];

    if (this.options.yAxis?.grid) {
      for (let i = 0; i <= yTicks; i++) {
        const y = padding.top + (chartHeight / yTicks) * i;
        gridLines.push(html`
          <line class="grid-line"
                x1="${padding.left}"
                y1="${y}"
                x2="${padding.left + chartWidth}"
                y2="${y}" />
        `);
      }
    }

    if (this.options.xAxis?.grid) {
      for (let i = 0; i <= xCount; i++) {
        const x = padding.left + (chartWidth / xCount) * i;
        gridLines.push(html`
          <line class="grid-line"
                x1="${x}"
                y1="${padding.top}"
                x2="${x}"
                y2="${padding.top + chartHeight}" />
        `);
      }
    }

    return gridLines;
  }

  private renderCartesianAxes(padding: any, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number) {
    const yTicks = this.options.yAxis?.ticks || 5;
    const axes = [];

    // Y axis
    axes.push(html`
      <line class="axis-line"
            x1="${padding.left}"
            y1="${padding.top}"
            x2="${padding.left}"
            y2="${padding.top + chartHeight}" />
    `);

    // Y axis labels
    for (let i = 0; i <= yTicks; i++) {
      const value = yMax - (yMax - yMin) / yTicks * i;
      const y = padding.top + (chartHeight / yTicks) * i;
      axes.push(html`
        <text class="axis-label"
              x="${padding.left - 10}"
              y="${y}"
              text-anchor="end"
              alignment-baseline="middle">
          ${value.toFixed(1)}
        </text>
      `);
    }

    // X axis
    axes.push(html`
      <line class="axis-line"
            x1="${padding.left}"
            y1="${padding.top + chartHeight}"
            x2="${padding.left + chartWidth}"
            y2="${padding.top + chartHeight}" />
    `);

    // X axis labels
    for (let i = 0; i <= xCount; i++) {
      const x = padding.left + (chartWidth / xCount) * i;
      const label = this.labels[i] || i.toString();
      axes.push(html`
        <text class="axis-label"
              x="${x}"
              y="${padding.top + chartHeight + 20}"
              text-anchor="middle">
          ${label}
        </text>
      `);
    }

    return axes;
  }

  private renderDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number) {
    const chartType = dataset.type || this.type;

    switch (chartType) {
      case 'line':
        return this.renderLineDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
      case 'area':
        return this.renderAreaDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
      case 'bar':
        return this.renderBarDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax, xCount);
      case 'scatter':
        return this.renderScatterDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
      case 'bubble':
        return this.renderBubbleDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
      default:
        return this.renderLineDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
    }
  }

  private renderLineDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number) {
    const points = this.getDataPoints(dataset, chartWidth, chartHeight, yMin, yMax);
    const color = this.getDatasetColor(dataset, datasetIndex);
    const borderWidth = dataset.borderWidth || 2;
    const pointRadius = dataset.pointRadius !== undefined ? dataset.pointRadius : 4;
    const tension = dataset.tension || 0;

    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;

      if (tension > 0) {
        // Smooth curve
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const cpx = prev.x + (curr.x - prev.x) * 0.5;
          pathD += ` Q ${cpx} ${prev.y}, ${cpx} ${curr.y}`;
          pathD += ` Q ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
        }
      } else {
        // Straight lines
        points.slice(1).forEach(p => {
          pathD += ` L ${p.x} ${p.y}`;
        });
      }
    }

    return html`
      <path class="chart-path"
            d="${pathD}"
            fill="none"
            stroke="${dataset.borderColor || color}"
            stroke-width="${borderWidth}" />
      ${points.map((p, i) => html`
        <circle class="data-point"
                cx="${p.x}"
                cy="${p.y}"
                r="${pointRadius}"
                fill="${color}"
                @mouseenter=${(e: MouseEvent) => this.showTooltip(dataset, i, e)}
                @mouseleave=${() => this.hideTooltip()} />
      `)}
    `;
  }

  private renderAreaDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number) {
    const points = this.getDataPoints(dataset, chartWidth, chartHeight, yMin, yMax);
    const color = this.getDatasetColor(dataset, datasetIndex);
    const borderWidth = dataset.borderWidth || 2;

    if (points.length === 0) return '';

    let pathD = `M ${points[0].x} ${chartHeight}`;
    pathD += ` L ${points[0].x} ${points[0].y}`;
    points.slice(1).forEach(p => {
      pathD += ` L ${p.x} ${p.y}`;
    });
    pathD += ` L ${points[points.length - 1].x} ${chartHeight} Z`;

    const lineD = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');

    return html`
      <path class="chart-path"
            d="${pathD}"
            fill="${dataset.backgroundColor || color}"
            fill-opacity="0.3" />
      <path class="chart-path"
            d="${lineD}"
            fill="none"
            stroke="${dataset.borderColor || color}"
            stroke-width="${borderWidth}" />
    `;
  }

  private renderBarDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number) {
    const color = this.getDatasetColor(dataset, datasetIndex);
    const barWidth = (chartWidth / xCount) * 0.8 / this.datasets.filter((_, i) => !this.hiddenDatasets.has(i)).length;
    const visibleDatasets = this.datasets.filter((_, i) => !this.hiddenDatasets.has(i));
    const datasetOffset = visibleDatasets.indexOf(dataset);

    return html`
      ${dataset.data.map((value, index) => {
        const y = typeof value === 'number' ? value : (value as ChartDataPoint).y || 0;
        const barHeight = ((y - yMin) / (yMax - yMin)) * chartHeight;
        const x = (chartWidth / xCount) * index + datasetOffset * barWidth + (chartWidth / xCount) * 0.1;
        const barY = chartHeight - barHeight;

        return html`
          <rect class="chart-bar"
                x="${x}"
                y="${barY}"
                width="${barWidth}"
                height="${barHeight}"
                fill="${Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[index % dataset.backgroundColor.length] : color}"
                @mouseenter=${(e: MouseEvent) => this.showTooltip(dataset, index, e)}
                @mouseleave=${() => this.hideTooltip()} />
        `;
      })}
    `;
  }

  private renderBarChart(horizontal: boolean) {
    // Similar to renderBarDataset but with swapped axes
    return this.renderCartesianChart();
  }

  private renderScatterDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number) {
    const color = this.getDatasetColor(dataset, datasetIndex);
    const pointRadius = dataset.pointRadius !== undefined ? dataset.pointRadius : 4;

    return html`
      ${dataset.data.map((value, index) => {
        const point = typeof value === 'object' ? value as ChartDataPoint : { x: index, y: value };
        const x = typeof point.x === 'number' ? (point.x / (this.getXAxisCount())) * chartWidth : 0;
        const y = chartHeight - ((point.y! - yMin) / (yMax - yMin)) * chartHeight;

        return html`
          <circle class="data-point"
                  cx="${x}"
                  cy="${y}"
                  r="${pointRadius}"
                  fill="${color}"
                  @mouseenter=${(e: MouseEvent) => this.showTooltip(dataset, index, e)}
                  @mouseleave=${() => this.hideTooltip()} />
        `;
      })}
    `;
  }

  private renderBubbleDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number) {
    const color = this.getDatasetColor(dataset, datasetIndex);
    const maxR = Math.max(...dataset.data.map(v => typeof v === 'object' ? (v as ChartDataPoint).r || 5 : 5));

    return html`
      ${dataset.data.map((value, index) => {
        const point = value as ChartDataPoint;
        const x = typeof point.x === 'number' ? (point.x / this.getXAxisCount()) * chartWidth : 0;
        const y = chartHeight - ((point.y! - yMin) / (yMax - yMin)) * chartHeight;
        const r = ((point.r || 5) / maxR) * 20;

        return html`
          <circle class="data-point"
                  cx="${x}"
                  cy="${y}"
                  r="${r}"
                  fill="${color}"
                  fill-opacity="0.6"
                  @mouseenter=${(e: MouseEvent) => this.showTooltip(dataset, index, e)}
                  @mouseleave=${() => this.hideTooltip()} />
        `;
      })}
    `;
  }

  private renderPieChart(isDonut: boolean) {
    const width = this.width || this.offsetWidth || 600;
    const height = this.height || this.offsetHeight || 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const innerRadius = isDonut ? radius * 0.6 : 0;

    const dataset = this.datasets[0];
    if (!dataset) return html`<svg></svg>`;

    const total = dataset.data.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    let currentAngle = -Math.PI / 2;

    return html`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${dataset.data.map((value, index) => {
          const val = typeof value === 'number' ? value : 0;
          const angle = (val / total) * 2 * Math.PI;
          const endAngle = currentAngle + angle;

          const x1 = centerX + Math.cos(currentAngle) * radius;
          const y1 = centerY + Math.sin(currentAngle) * radius;
          const x2 = centerX + Math.cos(endAngle) * radius;
          const y2 = centerY + Math.sin(endAngle) * radius;

          const largeArc = angle > Math.PI ? 1 : 0;

          let pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          if (isDonut) {
            const ix1 = centerX + Math.cos(currentAngle) * innerRadius;
            const iy1 = centerY + Math.sin(currentAngle) * innerRadius;
            const ix2 = centerX + Math.cos(endAngle) * innerRadius;
            const iy2 = centerY + Math.sin(endAngle) * innerRadius;
            pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
          }

          const color = Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor[index % dataset.backgroundColor.length]
            : DEFAULT_COLORS[index % DEFAULT_COLORS.length];

          const result = html`
            <path class="chart-slice"
                  d="${pathD}"
                  fill="${color}"
                  @mouseenter=${(e: MouseEvent) => this.showTooltip(dataset, index, e)}
                  @mouseleave=${() => this.hideTooltip()} />
          `;

          currentAngle = endAngle;
          return result;
        })}
      </svg>
    `;
  }

  private renderRadarChart() {
    const width = this.width || this.offsetWidth || 600;
    const height = this.height || this.offsetHeight || 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    const numPoints = this.labels.length || this.datasets[0]?.data.length || 3;
    const angleStep = (2 * Math.PI) / numPoints;

    const maxValue = Math.max(...this.datasets.flatMap(d =>
      d.data.map(v => typeof v === 'number' ? v : 0)
    ));

    return html`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <!-- Radar grid -->
        ${[0.2, 0.4, 0.6, 0.8, 1].map(ratio => {
          const r = radius * ratio;
          const points = Array.from({ length: numPoints }, (_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${centerX + Math.cos(angle) * r},${centerY + Math.sin(angle) * r}`;
          }).join(' ');
          return html`<polygon points="${points}" fill="none" stroke="#e0e0e0" />`;
        })}

        <!-- Axes -->
        ${Array.from({ length: numPoints }, (_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return html`
            <line class="grid-line" x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" />
            <text class="axis-label" x="${x}" y="${y}" text-anchor="middle">
              ${this.labels[i] || i}
            </text>
          `;
        })}

        <!-- Data -->
        ${this.datasets.map((dataset, datasetIndex) => {
          if (this.hiddenDatasets.has(datasetIndex)) return '';

          const points = dataset.data.map((value, index) => {
            const val = typeof value === 'number' ? value : 0;
            const angle = index * angleStep - Math.PI / 2;
            const r = (val / maxValue) * radius;
            return `${centerX + Math.cos(angle) * r},${centerY + Math.sin(angle) * r}`;
          }).join(' ');

          const color = this.getDatasetColor(dataset, datasetIndex);

          return html`
            <polygon class="chart-path"
                     points="${points}"
                     fill="${color}"
                     fill-opacity="0.3"
                     stroke="${dataset.borderColor || color}"
                     stroke-width="${dataset.borderWidth || 2}" />
          `;
        })}
      </svg>
    `;
  }

  private getDataPoints(dataset: ChartDataset, chartWidth: number, chartHeight: number, yMin: number, yMax: number) {
    return dataset.data.map((value, index) => {
      const y = typeof value === 'number' ? value : (value as ChartDataPoint).y || 0;
      return {
        x: (chartWidth / (dataset.data.length - 1 || 1)) * index,
        y: chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight
      };
    });
  }

  private getYAxisRange() {
    const allValues = this.datasets.flatMap((dataset, index) =>
      this.hiddenDatasets.has(index) ? [] :
      dataset.data.map(v => typeof v === 'number' ? v : (v as ChartDataPoint).y || 0)
    );

    const min = this.options.yAxis?.min !== undefined ? this.options.yAxis.min : Math.min(0, ...allValues);
    const max = this.options.yAxis?.max !== undefined ? this.options.yAxis.max : Math.max(...allValues);

    return { min, max };
  }

  private getXAxisCount() {
    return Math.max(
      this.labels.length - 1,
      ...this.datasets.map(d => d.data.length - 1)
    ) || 1;
  }

  private getDatasetColor(dataset: ChartDataset, index: number): string {
    if (dataset.backgroundColor && !Array.isArray(dataset.backgroundColor)) {
      return dataset.backgroundColor;
    }
    if (dataset.borderColor) {
      return dataset.borderColor;
    }
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  }

  private handleLegendClick(index: number) {
    if (!this.options.legend?.clickable) return;

    this.toggleDataset(index);
  }

  private showTooltip(dataset: ChartDataset, index: number, event: MouseEvent) {
    if (this.options.tooltip?.trigger === 'none') return;

    const value = dataset.data[index];
    const label = this.labels[index] || index;

    let content = '';
    if (this.options.tooltip?.format) {
      content = this.options.tooltip.format(value, this.datasets.indexOf(dataset), index);
    } else {
      const val = typeof value === 'number' ? value : (value as ChartDataPoint).y;
      content = `${dataset.label}: ${val}`;
    }

    this.tooltipContent = content;
    this.tooltipX = event.offsetX + 10;
    this.tooltipY = event.offsetY - 30;
    this.tooltipVisible = true;
    ;
  }

  private hideTooltip() {
    this.tooltipVisible = false;
    ;
  }

  refresh(): void {
    ;
  }

  update(datasets: ChartDataset[]): void {
    this.datasets = datasets;
  }

  addDataset(dataset: ChartDataset): void {
    this.datasets = [...this.datasets, dataset];
  }

  removeDataset(index: number): void {
    this.datasets = this.datasets.filter((_, i) => i !== index);
    this.hiddenDatasets.delete(index);
  }

  toggleDataset(index: number): void {
    if (this.hiddenDatasets.has(index)) {
      this.hiddenDatasets.delete(index);
    } else {
      this.hiddenDatasets.add(index);
    }
    ;
  }

  exportImage(format: 'png' | 'svg' = 'svg'): string {
    const svg = this.shadowRoot?.querySelector('svg');
    if (!svg) return '';

    if (format === 'svg') {
      return new XMLSerializer().serializeToString(svg);
    }

    // For PNG, would need canvas conversion
    return '';
  }

  getData(): { datasets: ChartDataset[]; labels: string[] } {
    return {
      datasets: this.datasets,
      labels: this.labels
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-chart': SniceChart;
  }
}
