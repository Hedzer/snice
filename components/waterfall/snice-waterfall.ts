import { element, property, render, styles, dispatch, watch, html, css } from 'snice';
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
  @property({ type: Array }) data: WaterfallDataPoint[] = [];
  @property() orientation: 'vertical' | 'horizontal' = 'vertical';
  @property({ type: Boolean, attribute: 'show-values' }) showValues: boolean = true;
  @property({ type: Boolean, attribute: 'show-connectors' }) showConnectors: boolean = true;
  @property({ type: Boolean }) animated: boolean = false;

  private bars: ComputedBar[] = [];

  @styles()
  componentStyles() {
    return css`${waterfallStyles}`;
  }

  @watch('data')
  handleDataChange() {
    this.computeBars();
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

  @render()
  renderChart() {
    if (this.bars.length === 0) {
      return html`<div class="waterfall"><svg viewBox="0 0 100 100"></svg></div>`;
    }

    const padding = { top: 20, right: 20, bottom: 40, left: 20 };
    const barCount = this.bars.length;
    const chartWidth = Math.max(400, barCount * 60);
    const chartHeight = 300;
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    // Find min/max values
    let minVal = 0;
    let maxVal = 0;
    for (const bar of this.bars) {
      minVal = Math.min(minVal, bar.start, bar.end);
      maxVal = Math.max(maxVal, bar.start, bar.end);
    }

    // Add padding to range
    const range = maxVal - minVal || 1;
    const paddedMin = minVal - range * 0.05;
    const paddedMax = maxVal + range * 0.1;
    const totalRange = paddedMax - paddedMin;

    const barWidth = (plotWidth / barCount) * 0.6;
    const barGap = (plotWidth / barCount) * 0.4;

    const toY = (val: number) => padding.top + plotHeight - ((val - paddedMin) / totalRange) * plotHeight;
    const toX = (idx: number) => padding.left + (plotWidth / barCount) * idx + barGap / 2;

    // Zero line position
    const zeroY = toY(0);

    const barElements: string[] = [];
    const connectorElements: string[] = [];
    const labelElements: string[] = [];
    const valueElements: string[] = [];

    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];
      const x = toX(i);
      const barTop = toY(Math.max(bar.start, bar.end));
      const barBottom = toY(Math.min(bar.start, bar.end));
      const barHeight = Math.max(1, barBottom - barTop);

      barElements.push(`<rect class="waterfall-bar-${bar.type}" x="${x}" y="${barTop}" width="${barWidth}" height="${barHeight}" rx="2" data-index="${i}" />`);

      // Connector from previous bar
      if (this.showConnectors && i > 0) {
        const prevBar = this.bars[i - 1];
        const prevX = toX(i - 1) + barWidth;
        const connY = toY(prevBar.end);
        connectorElements.push(`<line class="waterfall-connector" x1="${prevX}" y1="${connY}" x2="${x}" y2="${connY}" />`);
      }

      // Label
      const labelX = x + barWidth / 2;
      labelElements.push(`<text class="waterfall-label" x="${labelX}" y="${chartHeight - 5}">${this.escSvg(bar.label)}</text>`);

      // Value
      if (this.showValues) {
        const valY = barTop - 5;
        const prefix = bar.type === 'total' ? '' : (bar.value >= 0 ? '+' : '');
        valueElements.push(`<text class="waterfall-value waterfall-value-${bar.type}" x="${labelX}" y="${valY}">${prefix}${this.formatValue(bar.value)}</text>`);
      }
    }

    const svgContent = `
      <line class="waterfall-axis" x1="${padding.left}" y1="${zeroY}" x2="${chartWidth - padding.right}" y2="${zeroY}" />
      ${connectorElements.join('')}
      ${barElements.join('')}
      ${labelElements.join('')}
      ${valueElements.join('')}
    `;

    return html`
      <div class="waterfall" @click=${(e: MouseEvent) => this.handleSvgClick(e)} @mouseover=${(e: MouseEvent) => this.handleSvgHover(e)}>
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet">
          ${html`${svgContent}`}
        </svg>
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
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-waterfall': SniceWaterfall;
  }
}
