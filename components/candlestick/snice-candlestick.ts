import { element, property, render, styles, dispatch, query, ready, dispose, watch, html, css } from 'snice';
import cssContent from './snice-candlestick.css?inline';
import type { CandleData, TimeFormat, YAxisFormat, SniceCandlestickElement } from './snice-candlestick.types';

const PADDING = { top: 16, right: 64, bottom: 32, left: 8 };
const VOLUME_HEIGHT_RATIO = 0.2;
const MIN_CANDLE_WIDTH = 3;
const MAX_CANDLE_WIDTH = 24;

@element('snice-candlestick')
export class SniceCandlestick extends HTMLElement implements SniceCandlestickElement {
  @property({ type: Array, attribute: false })
  data: CandleData[] = [];

  @property({ type: Boolean })
  showVolume = false;

  @property({ type: Boolean })
  showGrid = true;

  @property({ type: Boolean })
  showCrosshair = true;

  @property()
  bullishColor = '';

  @property()
  bearishColor = '';

  @property()
  timeFormat: TimeFormat = 'auto';

  @property()
  yAxisFormat: YAxisFormat = 'number';

  @property({ type: Boolean })
  zoomEnabled = true;

  @property({ type: Boolean })
  animation = true;

  @query('.candlestick')
  private containerEl?: HTMLElement;

  @query('.candlestick__svg')
  private svgEl?: SVGSVGElement;

  @query('.candlestick__chart-content')
  private chartContentEl?: SVGGElement;

  @query('.candlestick__crosshair-group')
  private crosshairGroupEl?: SVGGElement;

  @query('.candlestick__tooltip')
  private tooltipEl?: HTMLElement;

  // Internal state — plain fields, no @property
  private viewStart = 0;
  private viewEnd = 0;
  private mouseX = -1;
  private mouseY = -1;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartViewStart = 0;
  private dragStartViewEnd = 0;
  private resizeObserver: ResizeObserver | null = null;
  private svgWidth = 600;
  private svgHeight = 400;
  private lastDataLength = 0;
  private cachedData: CandleData[] = [];
  private rafId = 0;
  private animateNext = true;

  @dispatch('candle-click', { bubbles: true, composed: true })
  private emitCandleClick(candle: CandleData, index: number) {
    return { candle, index };
  }

  @dispatch('candle-hover', { bubbles: true, composed: true })
  private emitCandleHover(candle: CandleData, index: number) {
    return { candle, index };
  }

  @dispatch('crosshair-move', { bubbles: true, composed: true })
  private emitCrosshairMove(price: number, date: string, x: number, y: number) {
    return { price, date, x, y };
  }

  @ready()
  init() {
    this.cachedData = this.data;
    this.viewEnd = this.data.length;
    this.viewStart = Math.max(0, this.viewEnd - 80);
    this.resizeObserver = new ResizeObserver(() => {
      this.measureSize();
      this.rebuildChart();
    });
    if (this.containerEl) {
      this.resizeObserver.observe(this.containerEl);
    }
    this.measureSize();
    this.rebuildChart();
  }

  @dispose()
  cleanup() {
    this.resizeObserver?.disconnect();
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  @watch('data')
  onDataChange() {
    this.cachedData = this.data;
    const dataLen = this.cachedData.length;
    if (dataLen > 0 && dataLen !== this.lastDataLength) {
      this.lastDataLength = dataLen;
      this.viewEnd = dataLen;
      this.viewStart = Math.max(0, dataLen - 80);
    }
    this.animateNext = true;
    this.rebuildChart();
  }

  @watch('showVolume', 'showGrid', 'bullishColor', 'bearishColor', 'timeFormat', 'yAxisFormat', 'animation')
  onDisplayChange() {
    this.rebuildChart();
  }

  private measureSize() {
    if (!this.containerEl) return;
    const rect = this.containerEl.getBoundingClientRect();
    if (rect.width > 0) this.svgWidth = rect.width;
    if (rect.height > 0) this.svgHeight = rect.height;
  }

  private get visibleData(): CandleData[] {
    return this.cachedData.slice(this.viewStart, this.viewEnd);
  }

  private get chartArea() {
    const volumeSpace = this.showVolume ? this.svgHeight * VOLUME_HEIGHT_RATIO : 0;
    return {
      x: PADDING.left,
      y: PADDING.top,
      width: this.svgWidth - PADDING.left - PADDING.right,
      height: this.svgHeight - PADDING.top - PADDING.bottom - volumeSpace,
      volumeY: this.svgHeight - PADDING.bottom - volumeSpace,
      volumeHeight: volumeSpace
    };
  }

  private get priceRange() {
    const visible = this.visibleData;
    if (visible.length === 0) return { min: 0, max: 100 };
    let min = Infinity;
    let max = -Infinity;
    for (const d of visible) {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
    }
    const padding = (max - min) * 0.05 || 1;
    return { min: min - padding, max: max + padding };
  }

  private get volumeMax() {
    const visible = this.visibleData;
    if (visible.length === 0) return 1;
    return Math.max(...visible.map(d => d.volume || 0)) || 1;
  }

  private get candleWidth() {
    const area = this.chartArea;
    const count = this.visibleData.length || 1;
    const totalWidth = area.width / count;
    const bodyWidth = totalWidth * 0.7;
    return Math.max(MIN_CANDLE_WIDTH, Math.min(MAX_CANDLE_WIDTH, bodyWidth));
  }

  private priceToY(price: number): number {
    const { min, max } = this.priceRange;
    const area = this.chartArea;
    const ratio = (price - min) / (max - min);
    return area.y + area.height * (1 - ratio);
  }

  private yToPrice(y: number): number {
    const { min, max } = this.priceRange;
    const area = this.chartArea;
    const ratio = 1 - (y - area.y) / area.height;
    return min + ratio * (max - min);
  }

  private indexToX(index: number): number {
    const area = this.chartArea;
    const count = this.visibleData.length || 1;
    const step = area.width / count;
    return area.x + step * index + step / 2;
  }

  private xToIndex(x: number): number {
    const area = this.chartArea;
    const count = this.visibleData.length || 1;
    const step = area.width / count;
    const idx = Math.floor((x - area.x) / step);
    return Math.max(0, Math.min(count - 1, idx));
  }

  private formatPrice(price: number): string {
    switch (this.yAxisFormat) {
      case 'currency':
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'percent':
        return price.toFixed(2) + '%';
      default:
        return price >= 1000 ? price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : price.toFixed(2);
    }
  }

  private formatDate(dateVal: string | number | Date): string {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);

    const fmt = this.timeFormat;
    if (fmt === 'date') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (fmt === 'time') return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    if (fmt === 'datetime') return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (fmt === 'month') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    if (fmt === 'year') return d.getFullYear().toString();

    // auto
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /** Rebuild the static chart SVG (candles, grid, axes, volume). Does NOT include crosshair. */
  private rebuildChart() {
    if (!this.chartContentEl || !this.svgEl) {
      requestAnimationFrame(() => this.rebuildChart());
      return;
    }

    const visible = this.visibleData;
    let svg = '';
    if (visible.length > 0) {
      svg += this.buildGridLines();
      svg += this.buildYAxis();
      svg += this.buildXAxis();
      svg += this.buildVolumeBars();
      svg += this.buildCandles();
    }
    this.chartContentEl.innerHTML = svg;

    // Update SVG viewBox
    this.svgEl.setAttribute('viewBox', `0 0 ${this.svgWidth} ${this.svgHeight}`);
    this.svgEl.setAttribute('aria-label', `Candlestick chart with ${this.cachedData.length} data points`);

    // Update container height
    if (this.containerEl) {
      this.containerEl.style.height = `${this.svgHeight}px`;
    }

    // Consume animation flag after building candles
    this.animateNext = false;

    // Update crosshair after chart rebuild
    this.updateCrosshairDOM();
    this.updateTooltipDOM();
  }

  private handleMouseMove = (e: MouseEvent) => {
    const svg = this.svgEl;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;

    if (this.isDragging && this.zoomEnabled) {
      const dx = e.clientX - this.dragStartX;
      const area = this.chartArea;
      const viewSize = this.dragStartViewEnd - this.dragStartViewStart;
      const candlesPerPx = viewSize / area.width;
      const shift = Math.round(-dx * candlesPerPx);
      let newStart = this.dragStartViewStart + shift;
      let newEnd = this.dragStartViewEnd + shift;
      if (newStart < 0) { newStart = 0; newEnd = viewSize; }
      if (newEnd > this.cachedData.length) { newEnd = this.cachedData.length; newStart = this.cachedData.length - viewSize; }
      const vs = Math.max(0, newStart);
      const ve = Math.min(this.cachedData.length, newEnd);
      if (vs !== this.viewStart || ve !== this.viewEnd) {
        this.viewStart = vs;
        this.viewEnd = ve;
        this.rebuildChart();
        return;
      }
    }

    if (this.showCrosshair) {
      const idx = this.xToIndex(this.mouseX);
      const candle = this.visibleData[idx];
      if (candle) {
        const price = this.yToPrice(this.mouseY);
        this.emitCrosshairMove(price, this.formatDate(candle.date), this.mouseX, this.mouseY);
      }
    }

    // Only update crosshair + tooltip via direct DOM manipulation — no re-render
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this.updateCrosshairDOM();
      this.updateTooltipDOM();
    });
  };

  private handleMouseLeave = () => {
    this.mouseX = -1;
    this.mouseY = -1;
    this.isDragging = false;
    this.updateCrosshairDOM();
    this.updateTooltipDOM();
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.zoomEnabled) return;
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartViewStart = this.viewStart;
    this.dragStartViewEnd = this.viewEnd;
  };

  private handleMouseUp = () => {
    this.isDragging = false;
  };

  private handleWheel = (e: WheelEvent) => {
    if (!this.zoomEnabled) return;
    e.preventDefault();
    const viewSize = this.viewEnd - this.viewStart;
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    let newSize = Math.round(viewSize * zoomFactor);
    newSize = Math.max(10, Math.min(this.cachedData.length, newSize));

    const area = this.chartArea;
    const mouseRatio = (this.mouseX - area.x) / area.width;
    const center = this.viewStart + viewSize * mouseRatio;
    let newStart = Math.round(center - newSize * mouseRatio);
    let newEnd = newStart + newSize;
    if (newStart < 0) { newStart = 0; newEnd = newSize; }
    if (newEnd > this.cachedData.length) { newEnd = this.cachedData.length; newStart = this.cachedData.length - newSize; }
    this.viewStart = Math.max(0, newStart);
    this.viewEnd = Math.min(this.cachedData.length, newEnd);
    this.rebuildChart();
  };

  resetZoom(): void {
    this.viewStart = 0;
    this.viewEnd = this.cachedData.length;
    this.rebuildChart();
  }

  zoomTo(startIndex: number, endIndex: number): void {
    this.viewStart = Math.max(0, startIndex);
    this.viewEnd = Math.min(this.cachedData.length, endIndex);
    this.rebuildChart();
  }

  /** Update crosshair overlay via direct DOM manipulation — no re-render needed */
  private updateCrosshairDOM() {
    const group = this.crosshairGroupEl;
    if (!group) return;

    if (!this.showCrosshair || this.mouseX < 0 || this.mouseY < 0) {
      group.innerHTML = '';
      return;
    }

    const area = this.chartArea;
    const totalChartBottom = area.y + area.height + area.volumeHeight;
    const isInChart = this.mouseX >= area.x && this.mouseX <= area.x + area.width
      && this.mouseY >= area.y && this.mouseY <= totalChartBottom;

    if (!isInChart) {
      group.innerHTML = '';
      return;
    }

    const price = this.yToPrice(this.mouseY);
    const idx = this.xToIndex(this.mouseX);
    const candle = this.visibleData[idx];
    const snapX = this.indexToX(idx);

    let parts = '';

    // Horizontal line
    parts += `<line class="candlestick__crosshair-h" x1="${area.x}" y1="${this.mouseY}" x2="${area.x + area.width}" y2="${this.mouseY}" />`;

    // Vertical line
    parts += `<line class="candlestick__crosshair-v" x1="${snapX}" y1="${area.y}" x2="${snapX}" y2="${totalChartBottom}" />`;

    // Price label
    const priceLabel = this.formatPrice(price);
    const labelX = this.svgWidth - PADDING.right + 4;
    parts += `<rect class="candlestick__crosshair-label-bg" x="${labelX}" y="${this.mouseY - 9}" width="${PADDING.right - 8}" height="18" rx="2" />`;
    parts += `<text class="candlestick__crosshair-label" x="${labelX + 4}" y="${this.mouseY + 4}">${priceLabel}</text>`;

    // Date label
    if (candle) {
      const dateLabel = this.formatDate(candle.date);
      const dateLabelY = totalChartBottom + 4;
      parts += `<rect class="candlestick__crosshair-label-bg" x="${snapX - 36}" y="${dateLabelY}" width="72" height="18" rx="2" />`;
      parts += `<text class="candlestick__crosshair-label" x="${snapX}" y="${dateLabelY + 13}" text-anchor="middle">${dateLabel}</text>`;
    }

    group.innerHTML = parts;
  }

  /** Update tooltip via direct DOM manipulation — no re-render needed */
  private updateTooltipDOM() {
    const tooltip = this.tooltipEl;
    if (!tooltip) return;

    const tooltipCandle = this.getTooltipCandle();
    const hasTooltip = tooltipCandle !== null;

    if (!hasTooltip) {
      tooltip.classList.remove('candlestick__tooltip--visible');
      return;
    }

    const isBullish = tooltipCandle.close >= tooltipCandle.open;
    const showVolumeInTooltip = this.showVolume && tooltipCandle.volume !== undefined;
    const tooltipIdx = this.xToIndex(this.mouseX);
    const tooltipX = this.indexToX(tooltipIdx);

    const tooltipLeft = tooltipX + this.candleWidth + 12;
    const tooltipFlip = tooltipLeft + 160 > this.svgWidth;
    const tooltipFinalLeft = tooltipFlip ? tooltipX - this.candleWidth - 170 : tooltipLeft;

    tooltip.style.left = `${Math.max(0, tooltipFinalLeft)}px`;
    tooltip.style.top = `${PADDING.top}px`;
    tooltip.classList.add('candlestick__tooltip--visible');

    let rows = '';
    rows += `<div class="candlestick__tooltip-row"><span class="candlestick__tooltip-label">Date</span><span class="candlestick__tooltip-value">${this.formatDate(tooltipCandle.date)}</span></div>`;
    rows += `<div class="candlestick__tooltip-row"><span class="candlestick__tooltip-label">Open</span><span class="candlestick__tooltip-value">${this.formatPrice(tooltipCandle.open)}</span></div>`;
    rows += `<div class="candlestick__tooltip-row"><span class="candlestick__tooltip-label">High</span><span class="candlestick__tooltip-value">${this.formatPrice(tooltipCandle.high)}</span></div>`;
    rows += `<div class="candlestick__tooltip-row"><span class="candlestick__tooltip-label">Low</span><span class="candlestick__tooltip-value">${this.formatPrice(tooltipCandle.low)}</span></div>`;
    const closeClass = isBullish ? 'candlestick__tooltip-value--bullish' : 'candlestick__tooltip-value--bearish';
    rows += `<div class="candlestick__tooltip-row"><span class="candlestick__tooltip-label">Close</span><span class="candlestick__tooltip-value ${closeClass}">${this.formatPrice(tooltipCandle.close)}</span></div>`;
    if (showVolumeInTooltip) {
      rows += `<div class="candlestick__tooltip-row"><span class="candlestick__tooltip-label">Volume</span><span class="candlestick__tooltip-value">${tooltipCandle.volume?.toLocaleString() || '0'}</span></div>`;
    }

    tooltip.innerHTML = rows;
  }

  private buildGridLines(): string {
    if (!this.showGrid) return '';
    const area = this.chartArea;
    const { min, max } = this.priceRange;
    const ticks = 6;
    const step = (max - min) / ticks;
    let lines = '';

    for (let i = 0; i <= ticks; i++) {
      const price = min + step * i;
      const y = this.priceToY(price);
      lines += `<line class="candlestick__grid-line" x1="${area.x}" y1="${y}" x2="${area.x + area.width}" y2="${y}" />`;
    }

    return lines;
  }

  private buildYAxis(): string {
    const { min, max } = this.priceRange;
    const ticks = 6;
    const step = (max - min) / ticks;
    let labels = '';
    const labelX = this.svgWidth - PADDING.right + 8;

    for (let i = 0; i <= ticks; i++) {
      const price = min + step * i;
      const y = this.priceToY(price);
      labels += `<text class="candlestick__axis-label candlestick__axis-label--y" x="${labelX}" y="${y}">${this.formatPrice(price)}</text>`;
    }

    return labels;
  }

  private buildXAxis(): string {
    const visible = this.visibleData;
    if (visible.length === 0) return '';
    const area = this.chartArea;
    const labelY = area.y + area.height + area.volumeHeight + 16;
    const maxLabels = Math.floor(area.width / 80);
    const step = Math.max(1, Math.ceil(visible.length / maxLabels));
    let labels = '';

    for (let i = 0; i < visible.length; i += step) {
      const x = this.indexToX(i);
      labels += `<text class="candlestick__axis-label candlestick__axis-label--x" x="${x}" y="${labelY}">${this.formatDate(visible[i].date)}</text>`;
    }

    return labels;
  }

  private buildCandles(): string {
    const visible = this.visibleData;
    if (visible.length === 0) return '';

    const cw = this.candleWidth;
    const halfCw = cw / 2;
    let parts = '';

    for (let i = 0; i < visible.length; i++) {
      const candle = visible[i];
      const isBullish = candle.close >= candle.open;
      const color = isBullish
        ? (this.bullishColor || 'var(--candlestick-bullish)')
        : (this.bearishColor || 'var(--candlestick-bearish)');

      const x = this.indexToX(i);
      const highY = this.priceToY(candle.high);
      const lowY = this.priceToY(candle.low);
      const openY = this.priceToY(candle.open);
      const closeY = this.priceToY(candle.close);

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));

      const shouldAnimate = this.animation && this.animateNext;
      const animDelay = shouldAnimate ? `animation-delay: ${i * 8}ms;` : '';
      const wickAnimClass = shouldAnimate ? ' candlestick__wick--animated' : '';
      const bodyAnimClass = shouldAnimate ? ' candlestick__body--animated' : '';

      // Wick (high to low)
      parts += `<line class="candlestick__wick${wickAnimClass}" x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${color}" style="${animDelay}" />`;

      // Body (open to close)
      parts += `<rect class="candlestick__body${bodyAnimClass}" x="${x - halfCw}" y="${bodyTop}" width="${cw}" height="${bodyHeight}" fill="${color}" stroke="${color}" stroke-width="1" rx="1" style="${animDelay}" data-candle-index="${i}" />`;
    }

    return parts;
  }

  private buildVolumeBars(): string {
    if (!this.showVolume) return '';

    const visible = this.visibleData;
    if (visible.length === 0) return '';

    const area = this.chartArea;
    const volMax = this.volumeMax;
    const cw = this.candleWidth;
    const halfCw = cw / 2;
    let parts = '';

    for (let i = 0; i < visible.length; i++) {
      const candle = visible[i];
      const vol = candle.volume || 0;
      const isBullish = candle.close >= candle.open;
      const color = isBullish
        ? (this.bullishColor || 'var(--candlestick-bullish)')
        : (this.bearishColor || 'var(--candlestick-bearish)');

      const x = this.indexToX(i);
      const barHeight = (vol / volMax) * area.volumeHeight;
      const barY = area.volumeY + area.volumeHeight - barHeight;

      const shouldAnimate = this.animation && this.animateNext;
      const animDelay = shouldAnimate ? `animation-delay: ${i * 8}ms;` : '';
      const animClass = shouldAnimate ? ' candlestick__volume--animated' : '';

      parts += `<rect class="candlestick__volume${animClass}" x="${x - halfCw}" y="${barY}" width="${cw}" height="${barHeight}" fill="${color}" style="${animDelay}" />`;
    }

    return parts;
  }

  private getTooltipCandle(): CandleData | null {
    if (this.mouseX < 0) return null;
    const area = this.chartArea;
    if (this.mouseX < area.x || this.mouseX > area.x + area.width) return null;
    const idx = this.xToIndex(this.mouseX);
    return this.visibleData[idx] || null;
  }

  @render({ once: true })
  renderContent() {
    return html/*html*/`
      <div class="candlestick"
           style="height: ${this.svgHeight}px;"
           @mousemove=${this.handleMouseMove}
           @mouseleave=${this.handleMouseLeave}
           @mousedown=${this.handleMouseDown}
           @mouseup=${this.handleMouseUp}
           @wheel=${this.handleWheel}>
        <svg class="candlestick__svg" viewBox="0 0 ${this.svgWidth} ${this.svgHeight}" preserveAspectRatio="none" role="img" aria-label="Candlestick chart with ${this.data.length} data points">
          <g class="candlestick__chart-content"></g>
          <g class="candlestick__crosshair-group"></g>
        </svg>
        <div class="candlestick__tooltip"></div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-candlestick': SniceCandlestick;
  }
}
