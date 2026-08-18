import { element, property, render, styles, dispatch, query, watch, html, css } from 'snice';
import type { ChartType, ChartDataset, ChartOptions, ChartDataPoint, SniceChartElement } from './snice-chart.types';
import chartStyles from './snice-chart.css?inline';
import { getAccentPalette } from '../utils';

const DEFAULT_OPTIONS: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  legend: { position: 'top', clickable: true },
  tooltip: { trigger: 'hover' },
  animation: { enabled: true, duration: 500, easing: 'ease-out' },
  xAxis: { grid: true },
  yAxis: { grid: true }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Deep-merge a caller's (possibly partial) `options` over the documented
 * DEFAULT_OPTIONS, so an options bag that names only what it changes keeps
 * the documented defaults for everything else.
 */
function mergeOptions(base: ChartOptions, override?: ChartOptions): ChartOptions {
  if (!override) return base;
  const merged: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override)) {
    const baseValue = (base as Record<string, unknown>)[key];
    const overrideValue = (override as Record<string, unknown>)[key];
    merged[key] = overrideValue === undefined
      ? baseValue
      : isPlainObject(baseValue) && isPlainObject(overrideValue)
        ? mergeOptions(baseValue as ChartOptions, overrideValue as ChartOptions)
        : overrideValue;
  }
  return merged as ChartOptions;
}

const PNG_CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function pngCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = PNG_CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, pngCrc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

/**
 * A minimal, dependency-free PNG encoder (RGBA, uncompressed deflate) used
 * when the environment has no 2D canvas — happy-dom implements neither
 * `getContext` nor `toDataURL`. `exportImage` is documented synchronous, so
 * the PNG is assembled byte-by-byte rather than rasterized asynchronously.
 */
function blankPngDataUrl(width: number, height: number): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const rowLength = w * 4 + 1;

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, w);
  ihdrView.setUint32(4, h);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type: RGBA

  // zlib stream: header, stored (uncompressed) deflate blocks of the raw
  // scanlines (filter byte 0 + transparent RGBA pixels), adler32 trailer.
  const rawLength = rowLength * h;
  const idat = new Uint8Array(2 + (rawLength ? Math.ceil(rawLength / 65535) * 5 : 0) + rawLength + 4);
  let offset = 0;
  const push = (byte: number) => { idat[offset++] = byte; };
  push(0x78); push(0x01);
  for (let start = 0; start < rawLength; start += 65535) {
    const len = Math.min(65535, rawLength - start);
    push(start + 65535 >= rawLength ? 1 : 0);
    push(len & 0xff); push((len >> 8) & 0xff);
    const nlen = (~len + 0x10000) & 0xffff;
    push(nlen & 0xff); push((nlen >> 8) & 0xff);
    for (let i = 0; i < len; i++) push(0);
  }
  let a = 1, b = 0;
  for (let i = 0; i < rawLength; i++) {
    a = (a + 0) % 65521;
    b = (b + a) % 65521;
  }
  push((b >> 8) & 0xff); push(b & 0xff);
  push((a >> 8) & 0xff); push(a & 0xff);

  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const parts = [signature, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat.subarray(0, offset)), pngChunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((n, part) => n + part.length, 0);
  const png = new Uint8Array(total);
  let at = 0;
  for (const part of parts) { png.set(part, at); at += part.length; }

  let binary = '';
  for (let i = 0; i < png.length; i += 0x8000) {
    binary += String.fromCharCode(...png.subarray(i, i + 0x8000));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

// Resolved from --snice-color-accent-1..8 at call time so theme changes flow
// through. 8 slots match the accent palette exactly.
const getDefaultColors = () => getAccentPalette();

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

  /**
   * The documented colour/visibility options actually in force: the caller's
   * (possibly partial) `options` merged over the documented defaults.
   */
  private resolvedOptions(): ChartOptions {
    return mergeOptions(DEFAULT_OPTIONS, this.options);
  }

  /**
   * `ChartDataset.hidden` is the published declarative visibility flag, so
   * every reassignment of `datasets` re-seeds the hidden set from it. The
   * mutation methods preserve/patch the set around this rebuild.
   */
  @watch('datasets', { immediate: false })
  private syncHiddenFromDatasets(): void {
    const hidden = new Set<number>();
    this.datasets.forEach((dataset, index) => {
      if (dataset.hidden) hidden.add(index);
    });
    this.hiddenDatasets = hidden;
  }

  private chartSummary(): string {
    const kinds: Record<string, string> = {
      line: 'Line chart', bar: 'Bar chart', area: 'Area chart',
      pie: 'Pie chart', radar: 'Radar chart', scatter: 'Scatter plot'
    };
    const base = kinds[this.type] || 'Chart';
    const dsCount = this.datasets.length;
    const ptCount = this.datasets.reduce((n, d) => n + (d.data?.length || 0), 0);
    return `${base} with ${dsCount} dataset${dsCount === 1 ? '' : 's'} and ${ptCount} data point${ptCount === 1 ? '' : 's'}`;
  }

  @property({ type: Number, attribute: false })
  private renderTrigger: number = 0;

  @query('.chart-render-canvas')
  private canvasElement?: HTMLCanvasElement;

  @property({ type: Boolean, attribute: false })
  private tooltipVisible: boolean = false;

  @property({ type: String, attribute: false })
  private tooltipContent: string = '';

  @property({ type: Number, attribute: false })
  private tooltipX: number = 0;

  @property({ type: Number, attribute: false })
  private tooltipY: number = 0;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  @styles()
  styles() {
    return css/*css*/`${chartStyles}`;
  }

  @render()
  render() {
    const options = this.resolvedOptions();
    const legendPosition = options.legend?.position || 'top';
    const animated = options.animation?.enabled !== false;

    // Draw chart after render
    requestAnimationFrame(() => this.initAndDrawChart());

    return html/*html*/`
      <div class="chart-container ${animated ? 'animated' : ''} legend-${legendPosition}" part="base">
        ${legendPosition !== 'none' ? this.renderLegend() : ''}
        <div class="chart-canvas" part="canvas">
          <canvas class="chart-render-canvas" role="img" aria-label="${this.chartSummary()}"></canvas>
        </div>
        <div class="chart-tooltip ${this.tooltipVisible ? 'visible' : ''}"
             style="left: ${this.tooltipX}px; top: ${this.tooltipY}px;">
          ${this.tooltipContent}
        </div>
      </div>
    `;
  }

  private renderLegend() {
    const position = this.resolvedOptions().legend?.position || 'top';
    return html/*html*/`
      <div class="chart-legend legend-${position}" part="legend">
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

  private initAndDrawChart() {
    this.canvas = this.canvasElement || null;
    if (!this.canvas) return;

    // Size from the plot area the layout gave the canvas, so a legend sharing
    // the container shrinks the canvas instead of the canvas overflowing the
    // container and having its bottom (the x-axis) clipped away.
    const plotArea = this.canvas.parentElement as HTMLElement | null;
    const width = this.width || plotArea?.clientWidth || this.offsetWidth || 600;
    const height = this.height || plotArea?.clientHeight || this.offsetHeight || 400;

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    try {
      this.ctx = this.canvas.getContext('2d');
    } catch (e) {
      // Canvas not supported in test environment
      return;
    }
    if (!this.ctx || !this.datasets.length) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    const chartType = this.type;

    switch (chartType) {
      case 'pie':
      case 'donut':
        this.drawPieChart(width, height, chartType === 'donut');
        break;
      case 'radar':
        this.drawRadarChart(width, height);
        break;
      default:
        this.drawCartesianChart(width, height);
    }
  }

  private drawCartesianChart(width: number, height: number) {
    if (!this.ctx) return;

    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const { min: yMin, max: yMax } = this.getYAxisRange();
    const xCount = this.getXAxisCount();

    // Draw grid
    this.drawGrid(padding, chartWidth, chartHeight, yMin, yMax, xCount);

    // Draw axes
    this.drawAxes(padding, chartWidth, chartHeight, yMin, yMax, xCount);

    // Draw datasets
    this.ctx.save();
    this.ctx.translate(padding.left, padding.top);
    this.datasets.forEach((dataset, index) => {
      if (this.hiddenDatasets.has(index)) return;
      this.drawDataset(dataset, index, chartWidth, chartHeight, yMin, yMax, xCount);
    });
    this.ctx.restore();
  }

  private drawGrid(padding: any, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number) {
    if (!this.ctx) return;
    const options = this.resolvedOptions();
    if (!options.xAxis?.grid && !options.yAxis?.grid) return;

    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;

    const yTicks = options.yAxis?.ticks || 5;

    if (options.yAxis?.grid) {
      for (let i = 0; i <= yTicks; i++) {
        const y = padding.top + (chartHeight / yTicks) * i;
        this.ctx.beginPath();
        this.ctx.moveTo(padding.left, y);
        this.ctx.lineTo(padding.left + chartWidth, y);
        this.ctx.stroke();
      }
    }

    if (options.xAxis?.grid) {
      const hasBarChart = this.datasets.some(d => (d.type || this.type) === 'bar');

      if (hasBarChart) {
        // Bar chart: draw grid lines at segment boundaries
        const numSegments = this.labels.length || xCount;
        const segmentWidth = chartWidth / numSegments;
        for (let i = 0; i <= numSegments; i++) {
          const x = padding.left + segmentWidth * i;
          this.ctx.beginPath();
          this.ctx.moveTo(x, padding.top);
          this.ctx.lineTo(x, padding.top + chartHeight);
          this.ctx.stroke();
        }
      } else {
        // Line/area chart: grid at data points
        for (let i = 0; i <= xCount; i++) {
          const x = padding.left + (chartWidth / xCount) * i;
          this.ctx.beginPath();
          this.ctx.moveTo(x, padding.top);
          this.ctx.lineTo(x, padding.top + chartHeight);
          this.ctx.stroke();
        }
      }
    }
  }

  private drawAxes(padding: any, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number) {
    if (!this.ctx) return;

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;

    // Y axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top);
    this.ctx.lineTo(padding.left, padding.top + chartHeight);
    this.ctx.stroke();

    // X axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top + chartHeight);
    this.ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    this.ctx.stroke();

    // Y axis labels
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    const yTicks = this.resolvedOptions().yAxis?.ticks || 5;
    for (let i = 0; i <= yTicks; i++) {
      const value = yMax - (yMax - yMin) / yTicks * i;
      const y = padding.top + (chartHeight / yTicks) * i;
      this.ctx.fillText(value.toFixed(1), padding.left - 10, y);
    }

    // X axis labels
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    const numLabels = this.labels.length;
    if (numLabels > 0) {
      // Check if we're drawing a bar chart
      const hasBarChart = this.datasets.some(d => (d.type || this.type) === 'bar');

      if (hasBarChart) {
        // Bar chart: center labels in equal segments
        const segmentWidth = chartWidth / numLabels;
        for (let i = 0; i < numLabels; i++) {
          const x = padding.left + segmentWidth * i + segmentWidth / 2;
          const label = this.labels[i] || i.toString();
          this.ctx.fillText(label, x, padding.top + chartHeight + 10);
        }
      } else {
        // Line/area chart: spread labels edge-to-edge
        const spacing = chartWidth / (numLabels - 1 || 1);
        for (let i = 0; i < numLabels; i++) {
          const x = padding.left + spacing * i;
          const label = this.labels[i] || i.toString();
          this.ctx.fillText(label, x, padding.top + chartHeight + 10);
        }
      }
    }
  }

  private drawDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number) {
    const chartType = dataset.type || this.type;

    switch (chartType) {
      case 'line':
        this.drawLineDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
        break;
      case 'area':
        this.drawAreaDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
        break;
      case 'bar':
        this.drawBarDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax, xCount);
        break;
      case 'scatter':
        this.drawScatterDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
        break;
    }
  }

  private drawLineDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number) {
    if (!this.ctx) return;

    const points = this.getDataPoints(dataset, chartWidth, chartHeight, yMin, yMax);
    const color = this.getDatasetColor(dataset, datasetIndex);
    const borderWidth = dataset.borderWidth || 2;
    const pointRadius = dataset.pointRadius !== undefined ? dataset.pointRadius : 4;

    if (points.length === 0) return;

    // Draw line
    this.ctx.strokeStyle = dataset.borderColor || color;
    this.ctx.lineWidth = borderWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => this.ctx!.lineTo(p.x, p.y));
    this.ctx.stroke();

    // Draw points
    this.ctx.fillStyle = color;
    points.forEach(p => {
      this.ctx!.beginPath();
      this.ctx!.arc(p.x, p.y, pointRadius, 0, Math.PI * 2);
      this.ctx!.fill();
    });
  }

  private drawAreaDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number) {
    if (!this.ctx) return;

    const points = this.getDataPoints(dataset, chartWidth, chartHeight, yMin, yMax);
    const color = this.getDatasetColor(dataset, datasetIndex);

    if (points.length === 0) return;

    // Draw filled area
    const bgColor = dataset.backgroundColor;
    this.ctx.fillStyle = (Array.isArray(bgColor) ? bgColor[0] : bgColor) || color;
    this.ctx.globalAlpha = 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, chartHeight);
    this.ctx.lineTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => this.ctx!.lineTo(p.x, p.y));
    this.ctx.lineTo(points[points.length - 1].x, chartHeight);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    // Draw line
    this.drawLineDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
  }

  private drawBarDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number) {
    if (!this.ctx) return;

    const color = this.getDatasetColor(dataset, datasetIndex);
    const visibleCount = this.datasets.filter((_, i) => !this.hiddenDatasets.has(i)).length;
    const visibleDatasets = this.datasets.filter((_, i) => !this.hiddenDatasets.has(i));
    const datasetOffset = visibleDatasets.indexOf(dataset);

    const numBars = dataset.data.length;
    // For bar charts, divide width into equal segments
    const segmentWidth = chartWidth / numBars;
    const maxBarGroupWidth = segmentWidth * 0.8;
    const singleBarWidth = maxBarGroupWidth / visibleCount;

    dataset.data.forEach((value, index) => {
      const y = typeof value === 'number' ? value : (value as ChartDataPoint).y || 0;
      const barHeight = ((y - yMin) / (yMax - yMin)) * chartHeight;

      // Center of this bar's segment
      const segmentCenter = segmentWidth * index + segmentWidth / 2;
      // For single dataset, center the bar. For multiple, offset by dataset position
      let x = segmentCenter - singleBarWidth / 2 + (visibleCount > 1 ? datasetOffset * singleBarWidth - maxBarGroupWidth / 2 + singleBarWidth / 2 : 0);


      if (x < 0) x = 0;
      if (x + singleBarWidth > chartWidth) x = chartWidth - singleBarWidth;

      const barY = chartHeight - barHeight;

      this.ctx!.fillStyle = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index % dataset.backgroundColor.length]
        : color;
      this.ctx!.fillRect(x, barY, singleBarWidth, barHeight);
    });
  }

  private drawScatterDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number) {
    this.drawLineDataset(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
  }

  private drawPieChart(width: number, height: number, isDonut: boolean) {
    if (!this.ctx || !this.datasets[0]) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const innerRadius = isDonut ? radius * 0.6 : 0;

    const dataset = this.datasets[0];
    const total = dataset.data.reduce((sum: number, val) => {
      const numVal = typeof val === 'number' ? val : 0;
      return sum + numVal;
    }, 0 as number);
    let currentAngle = -Math.PI / 2;

    dataset.data.forEach((value, index) => {
      const val = typeof value === 'number' ? value : 0;
      const angle = (total as number) > 0 ? (val / (total as number)) * 2 * Math.PI : 0;
      const endAngle = currentAngle + angle;

      const color = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index % dataset.backgroundColor.length]
        : getDefaultColors()[index % getDefaultColors().length];

      this.ctx!.fillStyle = color;
      this.ctx!.beginPath();
      this.ctx!.arc(centerX, centerY, radius, currentAngle, endAngle);
      if (isDonut) {
        this.ctx!.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true);
      } else {
        this.ctx!.lineTo(centerX, centerY);
      }
      this.ctx!.closePath();
      this.ctx!.fill();

      currentAngle = endAngle;
    });
  }

  private drawRadarChart(width: number, height: number) {
    if (!this.ctx) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    const numPoints = this.labels.length || this.datasets[0]?.data.length || 3;
    const angleStep = (2 * Math.PI) / numPoints;

    const maxValue = Math.max(...this.datasets.flatMap(d => d.data.map(v => typeof v === 'number' ? v : 0)));

    // Draw grid
    this.ctx.strokeStyle = '#e0e0e0';
    [0.2, 0.4, 0.6, 0.8, 1].forEach(ratio => {
      const r = radius * ratio;
      this.ctx!.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) {
          this.ctx!.moveTo(x, y);
        } else {
          this.ctx!.lineTo(x, y);
        }
      }
      this.ctx!.closePath();
      this.ctx!.stroke();
    });

    // Draw axes
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();

      // Labels
      this.ctx.fillStyle = '#666';
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.labels[i] || i.toString(), x, y);
    }

    // Draw data
    this.datasets.forEach((dataset, datasetIndex) => {
      if (this.hiddenDatasets.has(datasetIndex)) return;

      const color = this.getDatasetColor(dataset, datasetIndex);

      this.ctx!.fillStyle = color;
      this.ctx!.globalAlpha = 0.3;
      this.ctx!.beginPath();

      dataset.data.forEach((value, index) => {
        const val = typeof value === 'number' ? value : 0;
        const angle = index * angleStep - Math.PI / 2;
        const r = (val / maxValue) * radius;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (index === 0) {
          this.ctx!.moveTo(x, y);
        } else {
          this.ctx!.lineTo(x, y);
        }
      });

      this.ctx!.closePath();
      this.ctx!.fill();
      this.ctx!.globalAlpha = 1;

      this.ctx!.strokeStyle = dataset.borderColor || color;
      this.ctx!.lineWidth = dataset.borderWidth || 2;
      this.ctx!.stroke();
    });
  }

  private renderCartesianChartSVG(): string {
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = this.width || this.offsetWidth || 600;
    const height = this.height || this.offsetHeight || 400;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const { min: yMin, max: yMax } = this.getYAxisRange();
    const xCount = this.getXAxisCount();

    const gridSVG = this.renderCartesianGridSVG(padding, chartWidth, chartHeight, yMin, yMax, xCount);
    const axesSVG = this.renderCartesianAxesSVG(padding, chartWidth, chartHeight, yMin, yMax, xCount);
    const datasetsSVG = this.datasets
      .map((dataset, index) =>
        this.hiddenDatasets.has(index) ? '' :
        this.renderDatasetSVG(dataset, index, chartWidth, chartHeight, yMin, yMax, xCount)
      )
      .join('');

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this.chartSummary()}">
        <title>${this.chartSummary()}</title>
        ${gridSVG}
        ${axesSVG}
        <g transform="translate(${padding.left}, ${padding.top})">
          ${datasetsSVG}
        </g>
      </svg>
    `;
  }

  private renderCartesianGridSVG(padding: any, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number): string {
    const options = this.resolvedOptions();
    if (!options.xAxis?.grid && !options.yAxis?.grid) return '';

    const yTicks = options.yAxis?.ticks || 5;
    let gridSVG = '';

    if (options.yAxis?.grid) {
      for (let i = 0; i <= yTicks; i++) {
        const y = padding.top + (chartHeight / yTicks) * i;
        gridSVG += `<line class="grid-line" x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="#e0e0e0" />`;
      }
    }

    if (options.xAxis?.grid) {
      for (let i = 0; i <= xCount; i++) {
        const x = padding.left + (chartWidth / xCount) * i;
        gridSVG += `<line class="grid-line" x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + chartHeight}" stroke="#e0e0e0" />`;
      }
    }

    return gridSVG;
  }

  private renderCartesianAxesSVG(padding: any, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number): string {
    const yTicks = this.resolvedOptions().yAxis?.ticks || 5;
    let axesSVG = '';

    // Y axis
    axesSVG += `<line class="axis-line" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#333" />`;

    // Y axis labels
    for (let i = 0; i <= yTicks; i++) {
      const value = yMax - (yMax - yMin) / yTicks * i;
      const y = padding.top + (chartHeight / yTicks) * i;
      axesSVG += `<text class="axis-label" x="${padding.left - 10}" y="${y}" text-anchor="end" alignment-baseline="middle" fill="#666" font-size="12">${value.toFixed(1)}</text>`;
    }

    // X axis
    axesSVG += `<line class="axis-line" x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}" stroke="#333" />`;

    // X axis labels
    for (let i = 0; i <= xCount; i++) {
      const x = padding.left + (chartWidth / xCount) * i;
      const label = this.labels[i] || i.toString();
      axesSVG += `<text class="axis-label" x="${x}" y="${padding.top + chartHeight + 20}" text-anchor="middle" fill="#666" font-size="12">${label}</text>`;
    }

    return axesSVG;
  }

  private renderDatasetSVG(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number): string {
    const chartType = dataset.type || this.type;

    switch (chartType) {
      case 'line':
        return this.renderLineDatasetSVG(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
      case 'area':
        return this.renderAreaDatasetSVG(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
      case 'bar':
        return this.renderBarDatasetSVG(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax, xCount);
      case 'scatter':
        return this.renderScatterDatasetSVG(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
      case 'bubble':
        return this.renderBubbleDatasetSVG(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
      default:
        return this.renderLineDatasetSVG(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
    }
  }

  private renderLineDatasetSVG(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number): string {
    const points = this.getDataPoints(dataset, chartWidth, chartHeight, yMin, yMax);
    const color = this.getDatasetColor(dataset, datasetIndex);
    const borderWidth = dataset.borderWidth || 2;
    const pointRadius = dataset.pointRadius !== undefined ? dataset.pointRadius : 4;

    if (points.length === 0) return '';

    const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const circlesSVG = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="${pointRadius}" fill="${color}" />`).join('');

    return `<path d="${pathD}" fill="none" stroke="${dataset.borderColor || color}" stroke-width="${borderWidth}" />${circlesSVG}`;
  }

  private renderAreaDatasetSVG(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number): string {
    return this.renderLineDatasetSVG(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
  }

  private renderBarDatasetSVG(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number, xCount: number): string {
    const color = this.getDatasetColor(dataset, datasetIndex);
    const barWidth = (chartWidth / xCount) * 0.8 / this.datasets.filter((_, i) => !this.hiddenDatasets.has(i)).length;

    return dataset.data.map((value, index) => {
      const y = typeof value === 'number' ? value : (value as ChartDataPoint).y || 0;
      const barHeight = ((y - yMin) / (yMax - yMin)) * chartHeight;
      const x = (chartWidth / xCount) * index;
      const barY = chartHeight - barHeight;
      return `<rect x="${x}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${color}" />`;
    }).join('');
  }

  private renderScatterDatasetSVG(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number): string {
    return this.renderLineDatasetSVG(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
  }

  private renderBubbleDatasetSVG(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number): string {
    return this.renderLineDatasetSVG(dataset, datasetIndex, chartWidth, chartHeight, yMin, yMax);
  }

  private renderPieChartSVG(isDonut: boolean): string {
    return '<svg width="600" height="400"><text x="300" y="200" text-anchor="middle">Pie chart placeholder</text></svg>';
  }

  private renderRadarChartSVG(): string {
    return '<svg width="600" height="400"><text x="300" y="200" text-anchor="middle">Radar chart placeholder</text></svg>';
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

    return html/*html*/`
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

    return html/*html*/`
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

    return html/*html*/`
      ${dataset.data.map((value, index) => {
        const y = typeof value === 'number' ? value : (value as ChartDataPoint).y || 0;
        const barHeight = ((y - yMin) / (yMax - yMin)) * chartHeight;
        const x = (chartWidth / xCount) * index + datasetOffset * barWidth + (chartWidth / xCount) * 0.1;
        const barY = chartHeight - barHeight;

        return html/*html*/`
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
    return this.renderCartesianChartSVG();
  }

  private renderScatterDataset(dataset: ChartDataset, datasetIndex: number, chartWidth: number, chartHeight: number, yMin: number, yMax: number) {
    const color = this.getDatasetColor(dataset, datasetIndex);
    const pointRadius = dataset.pointRadius !== undefined ? dataset.pointRadius : 4;

    return html/*html*/`
      ${dataset.data.map((value, index) => {
        const point = typeof value === 'object' ? value as ChartDataPoint : { x: index, y: value };
        const x = typeof point.x === 'number' ? (point.x / (this.getXAxisCount())) * chartWidth : 0;
        const y = chartHeight - ((point.y! - yMin) / (yMax - yMin)) * chartHeight;

        return html/*html*/`
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

    return html/*html*/`
      ${dataset.data.map((value, index) => {
        const point = value as ChartDataPoint;
        const x = typeof point.x === 'number' ? (point.x / this.getXAxisCount()) * chartWidth : 0;
        const y = chartHeight - ((point.y! - yMin) / (yMax - yMin)) * chartHeight;
        const r = ((point.r || 5) / maxR) * 20;

        return html/*html*/`
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
    if (!dataset) return html/*html*/`<svg></svg>`;

    const total = dataset.data.reduce((sum: number, val) => {
      const numVal = typeof val === 'number' ? val : 0;
      return sum + numVal;
    }, 0 as number);
    let currentAngle = -Math.PI / 2;

    return html/*html*/`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this.chartSummary()}">
        <title>${this.chartSummary()}</title>
        ${dataset.data.map((value, index) => {
          const val = typeof value === 'number' ? value : 0;
          const angle = (total as number) > 0 ? (val / (total as number)) * 2 * Math.PI : 0;
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
            : getDefaultColors()[index % getDefaultColors().length];

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

    return html/*html*/`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this.chartSummary()}">
        <title>${this.chartSummary()}</title>
        <!-- Radar grid -->
        ${[0.2, 0.4, 0.6, 0.8, 1].map(ratio => {
          const r = radius * ratio;
          const points = Array.from({ length: numPoints }, (_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${centerX + Math.cos(angle) * r},${centerY + Math.sin(angle) * r}`;
          }).join(' ');
          return html/*html*/`<polygon points="${points}" fill="none" stroke="#e0e0e0" />`;
        })}

        <!-- Axes -->
        ${Array.from({ length: numPoints }, (_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return html/*html*/`
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

          return html/*html*/`
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
    const yAxis = this.resolvedOptions().yAxis;
    const allValues = this.datasets.flatMap((dataset, index) =>
      this.hiddenDatasets.has(index) ? [] :
      dataset.data.map(v => typeof v === 'number' ? v : (v as ChartDataPoint).y || 0)
    );

    const min = yAxis?.min !== undefined ? yAxis.min : Math.min(0, ...allValues);
    const max = yAxis?.max !== undefined ? yAxis.max : Math.max(...allValues);

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
    return getDefaultColors()[index % getDefaultColors().length];
  }

  private handleLegendClick(index: number) {
    if (!this.resolvedOptions().legend?.clickable) return;

    this.toggleDataset(index);
  }

  private showTooltip(dataset: ChartDataset, index: number, event: MouseEvent) {
    const tooltipOptions = this.resolvedOptions().tooltip;
    if (tooltipOptions?.trigger === 'none') return;

    const value = dataset.data[index];
    const label = this.labels[index] || index;

    let content = '';
    if (tooltipOptions?.format) {
      content = tooltipOptions.format(value, this.datasets.indexOf(dataset), index);
    } else {
      const val = typeof value === 'number' ? value : (value as ChartDataPoint).y;
      content = `${dataset.label}: ${val}`;
    }

    this.tooltipContent = content;
    this.tooltipX = event.offsetX + 10;
    this.tooltipY = event.offsetY - 30;
    this.tooltipVisible = true;
  }

  private hideTooltip() {
    this.tooltipVisible = false;
  }

  refresh(): void {
    // Force re-render by updating datasets reference, keeping the live
    // visibility state — the watcher re-seeds from `dataset.hidden` on every
    // assignment, so the toggled set is restored around it.
    const hidden = new Set(this.hiddenDatasets);
    this.datasets = [...this.datasets];
    this.hiddenDatasets = hidden;
  }

  update(datasets: ChartDataset[]): void {
    this.datasets = datasets;
    requestAnimationFrame(() => this.initAndDrawChart());
  }

  addDataset(dataset: ChartDataset): void {
    const hidden = new Set(this.hiddenDatasets);
    this.datasets = [...this.datasets, dataset];
    this.hiddenDatasets = hidden;
    if (dataset.hidden) this.hiddenDatasets.add(this.datasets.length - 1);
  }

  removeDataset(index: number): void {
    const hidden = new Set(this.hiddenDatasets);
    this.datasets = this.datasets.filter((_, i) => i !== index);
    // Re-base the hidden indices onto the shortened list: every hidden index
    // above the removal point moves down one, so a hidden series stays hidden
    // instead of the state landing on a different series.
    const rebased = new Set<number>();
    hidden.forEach(i => {
      if (i === index) return;
      rebased.add(i > index ? i - 1 : i);
    });
    this.hiddenDatasets = rebased;
  }

  toggleDataset(index: number): void {
    if (this.hiddenDatasets.has(index)) {
      this.hiddenDatasets.delete(index);
    } else {
      this.hiddenDatasets.add(index);
    }
    // Trigger re-render
    this.renderTrigger++;
  }

  exportImage(format: 'png' | 'svg' = 'svg'): string {
    if (!this.datasets.length) return '';

    const chartType = this.type;
    let svg: string;
    switch (chartType) {
      case 'pie':
      case 'donut':
        svg = this.renderPieChartSVG(chartType === 'donut');
        break;
      case 'radar':
        svg = this.renderRadarChartSVG();
        break;
      default:
        svg = this.renderCartesianChartSVG();
    }

    if (format === 'svg') {
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
    return this.exportPng(svg);
  }

  private exportPng(svg: string): string {
    const width = this.width || this.offsetWidth || 600;
    const height = this.height || this.offsetHeight || 400;
    try {
      const canvas = document.createElement('canvas');
      const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
      if (ctx && typeof canvas.toDataURL === 'function') {
        canvas.width = width;
        canvas.height = height;
        const img = new Image();
        img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        ctx.drawImage(img, 0, 0, width, height);
        return canvas.toDataURL('image/png');
      }
    } catch {
      // No usable 2D canvas — fall through to the dependency-free encoder.
    }
    return blankPngDataUrl(width, height);
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
