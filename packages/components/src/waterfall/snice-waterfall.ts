import { element, property, render, styles, dispatch, watch, ready, query, html, css } from 'snice';
import type { WaterfallDataPoint, WaterfallBarType, SniceWaterfallElement } from './snice-waterfall.types';
import waterfallStyles from './snice-waterfall.css?inline';

interface ComputedBar {
  label: string;
  value: number;
  type: WaterfallBarType;
  start: number;
  end: number;
  index: number;
}

@element('snice-waterfall')
export class SniceWaterfall extends HTMLElement implements SniceWaterfallElement {
  @property({ type: Array, attribute: false }) data: WaterfallDataPoint[] = [];
  @property() orientation: 'vertical' | 'horizontal' = 'vertical';
  @property({ type: Boolean, attribute: 'show-values' }) showValues: boolean = true;
  @property({ type: Boolean, attribute: 'show-connectors' }) showConnectors: boolean = true;
  @property({ type: Boolean }) animated: boolean = false;

  private bars: ComputedBar[] = [];

  @query('.waterfall__chart')
  private chartEl!: HTMLElement;

  @styles()
  componentStyles() {
    return css/*css*/`${waterfallStyles}`;
  }

  @ready()
  init() {
    this.computeBars();
    this.rebuildChart();
  }

  @watch('data')
  handleDataChange() {
    this.computeBars();
    this.rebuildChart();
  }

  @watch('showValues', 'showConnectors', 'orientation', 'animated')
  handleDisplayChange() {
    this.rebuildChart();
  }

  private computeBars() {
    if (!this.data || this.data.length === 0) {
      this.bars = [];
      return;
    }

    let running = 0;
    this.bars = this.data.map((item, index) => {
      const type: WaterfallBarType = item.type || (item.value >= 0 ? 'increase' : 'decrease');

      if (type === 'total') {
        const bar: ComputedBar = { label: item.label, value: item.value, type, start: 0, end: item.value, index };
        running = item.value;
        return bar;
      }

      const start = running;
      running += item.value;
      return { label: item.label, value: item.value, type, start, end: running, index };
    });
  }

  private formatValue(val: number): string {
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(0);
  }

  private handleBarClick(bar: ComputedBar) {
    this.emitBarClick(this.data[bar.index], bar.index);
  }

  private handleBarHover(bar: ComputedBar) {
    this.emitBarHover(this.data[bar.index], bar.index);
  }

  @dispatch('bar-click', { bubbles: true, composed: true })
  private emitBarClick(item: WaterfallDataPoint, index: number) {
    return { item, index };
  }

  @dispatch('bar-hover', { bubbles: true, composed: true })
  private emitBarHover(item: WaterfallDataPoint, index: number) {
    return { item, index };
  }

  private rebuildChart() {
    if (!this.chartEl) return;

    if (this.bars.length === 0) {
      this.chartEl.innerHTML = '';
      return;
    }

    if (this.orientation === 'horizontal') {
      this.rebuildChartHorizontal();
    } else {
      this.rebuildChartVertical();
    }
  }

  private barClass(type: WaterfallBarType): string {
    return `waterfall-bar-${type}${this.animated ? ' waterfall-bar-animated' : ''}`;
  }

  /** vertical: values run up the page, bars advance across it. */
  private rebuildChartVertical() {
    const padding = { top: 20, right: 20, bottom: 40, left: 20 };
    const barCount = this.bars.length;
    const chartWidth = Math.max(400, barCount * 60);
    const chartHeight = 300;
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const { paddedMin, totalRange } = this.valueRange();

    const barWidth = (plotWidth / barCount) * 0.6;
    const barGap = (plotWidth / barCount) * 0.4;

    const toY = (val: number) => padding.top + plotHeight - ((val - paddedMin) / totalRange) * plotHeight;
    const toX = (idx: number) => padding.left + (plotWidth / barCount) * idx + barGap / 2;

    const zeroY = toY(0);

    const parts: string[] = [];
    parts.push(`<line class="waterfall-axis" x1="${padding.left}" y1="${zeroY}" x2="${chartWidth - padding.right}" y2="${zeroY}" />`);

    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];
      const x = toX(i);
      const barTop = toY(Math.max(bar.start, bar.end));
      const barBottom = toY(Math.min(bar.start, bar.end));
      const barHeight = Math.max(1, barBottom - barTop);

      if (this.showConnectors && i > 0) {
        const prevBar = this.bars[i - 1];
        const prevX = toX(i - 1) + barWidth;
        const connY = toY(prevBar.end);
        parts.push(`<line class="waterfall-connector" x1="${prevX}" y1="${connY}" x2="${x}" y2="${connY}" />`);
      }

      parts.push(this.barRect(bar, x, barTop, barWidth, barHeight));

      const labelX = x + barWidth / 2;
      parts.push(`<text class="waterfall-label" x="${labelX}" y="${chartHeight - 5}">${this.escSvg(bar.label)}</text>`);

      if (this.showValues) {
        const valY = barTop - 5;
        parts.push(this.valueText(bar, labelX, valY));
      }
    }

    this.chartEl.innerHTML = `<svg viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet">${parts.join('')}</svg>`;
  }

  /** horizontal: values run across the page, bars advance down it. */
  private rebuildChartHorizontal() {
    const padding = { top: 20, right: 20, bottom: 20, left: 40 };
    const barCount = this.bars.length;
    const chartWidth = 400;
    const chartHeight = Math.max(300, barCount * 60);
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const { paddedMin, totalRange } = this.valueRange();

    const barWidth = (plotHeight / barCount) * 0.6;
    const barGap = (plotHeight / barCount) * 0.4;

    const toX = (val: number) => padding.left + ((val - paddedMin) / totalRange) * plotWidth;
    const toY = (idx: number) => padding.top + (plotHeight / barCount) * idx + barGap / 2;

    const zeroX = toX(0);

    const parts: string[] = [];
    parts.push(`<line class="waterfall-axis" x1="${zeroX}" y1="${padding.top}" x2="${zeroX}" y2="${chartHeight - padding.bottom}" />`);

    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];
      const y = toY(i);
      const barLeft = toX(Math.min(bar.start, bar.end));
      const barRight = toX(Math.max(bar.start, bar.end));
      const barHeight = Math.max(1, barRight - barLeft);

      if (this.showConnectors && i > 0) {
        const prevBar = this.bars[i - 1];
        const prevY = toY(i - 1) + barWidth;
        const connX = toX(prevBar.end);
        parts.push(`<line class="waterfall-connector" x1="${connX}" y1="${prevY}" x2="${connX}" y2="${y}" />`);
      }

      parts.push(this.barRect(bar, barLeft, y, barHeight, barWidth));

      const labelY = y + barWidth / 2;
      parts.push(`<text class="waterfall-label" x="${padding.left - 5}" y="${labelY}" text-anchor="end">${this.escSvg(bar.label)}</text>`);

      if (this.showValues) {
        parts.push(this.valueText(bar, barRight + 5, labelY, 'start'));
      }
    }

    this.chartEl.innerHTML = `<svg viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet">${parts.join('')}</svg>`;
  }

  private valueRange(): { paddedMin: number; totalRange: number } {
    let minVal = 0;
    let maxVal = 0;
    for (const bar of this.bars) {
      minVal = Math.min(minVal, bar.start, bar.end);
      maxVal = Math.max(maxVal, bar.start, bar.end);
    }

    const range = maxVal - minVal || 1;
    const paddedMin = minVal - range * 0.05;
    const paddedMax = maxVal + range * 0.1;
    return { paddedMin, totalRange: paddedMax - paddedMin };
  }

  private barRect(bar: ComputedBar, x: number, y: number, width: number, height: number): string {
    return `<rect class="${this.barClass(bar.type)}" x="${x}" y="${y}" width="${width}" height="${height}" rx="2" data-index="${bar.index}" role="graphics-symbol" tabindex="0" aria-label="${this.escSvg(bar.label)}: ${this.formatValue(bar.value)}" />`;
  }

  private valueText(bar: ComputedBar, x: number, y: number, anchor = 'middle'): string {
    const prefix = bar.type === 'total' ? '' : (bar.value >= 0 ? '+' : '');
    return `<text class="waterfall-value waterfall-value-${bar.type}" x="${x}" y="${y}" text-anchor="${anchor}">${prefix}${this.formatValue(bar.value)}</text>`;
  }

  @render({ once: true })
  renderShell() {
    return html`
      <div class="waterfall" part="base" @click=${(e: MouseEvent) => this.handleSvgClick(e)} @mouseover=${(e: MouseEvent) => this.handleSvgHover(e)} @keydown=${(e: KeyboardEvent) => this.handleSvgKeydown(e)}>
        <div class="waterfall__chart" part="chart"></div>
      </div>
    `;
  }

  private escSvg(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private handleSvgClick(e: MouseEvent) {
    const target = e.target as SVGElement;
    const index = target.getAttribute?.('data-index');
    if (index !== null && index !== undefined) {
      const idx = parseInt(index, 10);
      if (!isNaN(idx) && this.bars[idx]) {
        this.handleBarClick(this.bars[idx]);
      }
    }
  }

  private handleSvgHover(e: MouseEvent) {
    const target = e.target as SVGElement;
    const index = target.getAttribute?.('data-index');
    if (index !== null && index !== undefined) {
      const idx = parseInt(index, 10);
      if (!isNaN(idx) && this.bars[idx]) {
        this.handleBarHover(this.bars[idx]);
      }
    }
  }

  private handleSvgKeydown(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as SVGElement;
    const index = target.getAttribute?.('data-index');
    if (index !== null && index !== undefined) {
      const idx = parseInt(index, 10);
      if (!isNaN(idx) && this.bars[idx]) {
        e.preventDefault();
        this.handleBarClick(this.bars[idx]);
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-waterfall': SniceWaterfall;
  }
}
