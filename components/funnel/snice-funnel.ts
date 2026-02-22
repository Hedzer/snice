import { element, property, dispatch, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-funnel.css?inline';
import type { FunnelStage, FunnelVariant, FunnelOrientation, SniceFunnelElement } from './snice-funnel.types';

const DEFAULT_COLORS = [
  'rgb(37 99 235)',
  'rgb(59 130 246)',
  'rgb(96 165 250)',
  'rgb(147 197 253)',
  'rgb(191 219 254)',
  'rgb(219 234 254)',
];

function escapeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

@element('snice-funnel')
export class SniceFunnel extends HTMLElement implements SniceFunnelElement {
  @property({ type: Array, attribute: false })
  data: FunnelStage[] = [];

  @property()
  variant: FunnelVariant = 'default';

  @property()
  orientation: FunnelOrientation = 'vertical';

  @property({ type: Boolean, attribute: 'show-labels' })
  showLabels = true;

  @property({ type: Boolean, attribute: 'show-values' })
  showValues = true;

  @property({ type: Boolean, attribute: 'show-percentages' })
  showPercentages = true;

  @property({ type: Boolean })
  animation = false;

  @property() private tooltipText = '';
  @property() private tooltipSubtext = '';
  @property({ type: Number }) private tooltipX = 0;
  @property({ type: Number }) private tooltipY = 0;
  @property({ type: Boolean }) private tooltipVisible = false;

  @dispatch('funnel-click', { bubbles: true, composed: true })
  private emitFunnelClick(stage: FunnelStage, index: number) {
    return { stage, index };
  }

  @dispatch('funnel-hover', { bubbles: true, composed: true })
  private emitFunnelHover(stage: FunnelStage, index: number) {
    return { stage, index };
  }

  private getColor(index: number, stage: FunnelStage): string {
    if (stage.color) return stage.color;
    if (this.variant === 'gradient' && this.data.length > 0) {
      const opacity = 1 - (index / this.data.length) * 0.6;
      return `rgba(37, 99, 235, ${opacity})`;
    }
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  }

  private getPercentage(index: number): string {
    if (this.data.length === 0) return '0%';
    const firstValue = this.data[0].value;
    if (firstValue === 0) return '0%';
    return `${Math.round((this.data[index].value / firstValue) * 100)}%`;
  }

  private formatValue(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(value);
  }

  private handleSvgClick(e: MouseEvent): void {
    const target = e.target as SVGElement;
    const indexStr = target.dataset?.index ?? target.closest('[data-index]')?.getAttribute('data-index');
    if (indexStr === null || indexStr === undefined) return;
    const index = parseInt(indexStr, 10);
    const stage = this.data[index];
    if (!stage) return;
    this.emitFunnelClick(stage, index);
  }

  private handleSvgMouseMove(e: MouseEvent): void {
    const target = e.target as SVGElement;
    const el = target.dataset?.index !== undefined ? target : target.closest('[data-index]') as SVGElement | null;
    if (!el) {
      if (this.tooltipVisible) {
        this.tooltipVisible = false;
      }
      return;
    }
    const index = parseInt(el.dataset.index!, 10);
    const stage = this.data[index];
    if (!stage) return;

    const rect = el.getBoundingClientRect();
    this.tooltipText = stage.label;
    this.tooltipSubtext = `${this.formatValue(stage.value)} (${this.getPercentage(index)})`;
    this.tooltipX = rect.left + rect.width / 2;
    this.tooltipY = rect.top - 8;
    this.tooltipVisible = true;
    this.emitFunnelHover(stage, index);
  }

  private handleSvgMouseLeave(): void {
    if (this.tooltipVisible) {
      this.tooltipVisible = false;
    }
  }

  private handleSvgKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as SVGElement;
    const indexStr = target.dataset?.index;
    if (indexStr === undefined) return;
    e.preventDefault();
    const index = parseInt(indexStr, 10);
    const stage = this.data[index];
    if (!stage) return;
    this.emitFunnelClick(stage, index);
  }

  private buildVerticalSVG(): string {
    const count = this.data.length;
    if (count === 0) return '';

    const svgWidth = 400;
    const stageHeight = 50;
    const gap = 4;
    const svgHeight = count * stageHeight + (count - 1) * gap;
    const maxWidth = svgWidth * 0.85;
    const minWidth = maxWidth * 0.25;
    const labelX = svgWidth - 10;
    const firstValue = this.data[0].value || 1;

    let svg = `<svg class="funnel__svg" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Funnel chart">`;

    for (let i = 0; i < count; i++) {
      const stage = this.data[i];
      const ratio = stage.value / firstValue;
      const topWidth = i === 0 ? maxWidth : minWidth + (maxWidth - minWidth) * (this.data[i - 1].value / firstValue);
      const bottomWidth = minWidth + (maxWidth - minWidth) * ratio;
      const y = i * (stageHeight + gap);
      const cx = svgWidth / 2;
      const topLeft = cx - topWidth / 2;
      const topRight = cx + topWidth / 2;
      const bottomLeft = cx - bottomWidth / 2;
      const bottomRight = cx + bottomWidth / 2;
      const color = escapeHTML(this.getColor(i, stage));
      const delay = this.animation ? ` style="animation-delay:${i * 100}ms"` : '';
      const path = `M ${topLeft} ${y} L ${topRight} ${y} L ${bottomRight} ${y + stageHeight} L ${bottomLeft} ${y + stageHeight} Z`;
      const textY = y + stageHeight / 2;
      const ariaLabel = escapeHTML(`${stage.label}: ${stage.value} (${this.getPercentage(i)})`);

      svg += `<g class="funnel__stage" data-index="${i}" tabindex="0" role="button" aria-label="${ariaLabel}">`;
      svg += `<path class="funnel__stage-shape" d="${path}" fill="${color}"${delay}/>`;

      if (this.showLabels) {
        const labelY = (this.showValues || this.showPercentages) ? textY - 6 : textY;
        svg += `<text class="funnel__label" x="${labelX}" y="${labelY}" text-anchor="end" dominant-baseline="middle">${escapeHTML(stage.label)}</text>`;
      }
      if (this.showValues) {
        const valY = this.showLabels ? textY + 8 : textY;
        svg += `<text class="funnel__value" x="${labelX}" y="${valY}" text-anchor="end" dominant-baseline="middle">${escapeHTML(this.formatValue(stage.value))}</text>`;
      }
      if (this.showPercentages && i > 0) {
        const pctY = this.showLabels ? textY + 20 : (this.showValues ? textY + 12 : textY);
        svg += `<text class="funnel__percentage" x="${labelX}" y="${pctY}" text-anchor="end" dominant-baseline="middle">${escapeHTML(this.getPercentage(i))}</text>`;
      }

      svg += `</g>`;
    }

    svg += `</svg>`;
    return svg;
  }

  private buildHorizontalSVG(): string {
    const count = this.data.length;
    if (count === 0) return '';

    const svgWidth = 500;
    const svgHeight = 250;
    const stageWidth = (svgWidth - (count - 1) * 4) / count;
    const maxHeight = svgHeight * 0.7;
    const minHeight = maxHeight * 0.25;
    const firstValue = this.data[0].value || 1;

    let svg = `<svg class="funnel__svg" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Funnel chart">`;

    for (let i = 0; i < count; i++) {
      const stage = this.data[i];
      const ratio = stage.value / firstValue;
      const leftHeight = i === 0 ? maxHeight : minHeight + (maxHeight - minHeight) * (this.data[i - 1].value / firstValue);
      const rightHeight = minHeight + (maxHeight - minHeight) * ratio;
      const x = i * (stageWidth + 4);
      const cy = svgHeight * 0.45;
      const color = escapeHTML(this.getColor(i, stage));
      const delay = this.animation ? ` style="animation-delay:${i * 100}ms"` : '';

      const topLeft = cy - leftHeight / 2;
      const bottomLeft = cy + leftHeight / 2;
      const topRight = cy - rightHeight / 2;
      const bottomRight = cy + rightHeight / 2;

      const path = `M ${x} ${topLeft} L ${x + stageWidth} ${topRight} L ${x + stageWidth} ${bottomRight} L ${x} ${bottomLeft} Z`;
      const textX = x + stageWidth / 2;
      const textY = svgHeight * 0.45 + maxHeight / 2 + 16;
      const ariaLabel = escapeHTML(`${stage.label}: ${stage.value} (${this.getPercentage(i)})`);

      svg += `<g class="funnel__stage" data-index="${i}" tabindex="0" role="button" aria-label="${ariaLabel}">`;
      svg += `<path class="funnel__stage-shape" d="${path}" fill="${color}"${delay}/>`;

      if (this.showLabels) {
        svg += `<text class="funnel__label" x="${textX}" y="${textY}" text-anchor="middle">${escapeHTML(stage.label)}</text>`;
      }
      if (this.showValues) {
        svg += `<text class="funnel__value" x="${textX}" y="${textY + 16}" text-anchor="middle">${escapeHTML(this.formatValue(stage.value))}</text>`;
      }
      if (this.showPercentages && i > 0) {
        svg += `<text class="funnel__percentage" x="${textX}" y="${textY + 30}" text-anchor="middle">${escapeHTML(this.getPercentage(i))}</text>`;
      }

      svg += `</g>`;
    }

    svg += `</svg>`;
    return svg;
  }

  setStages(stages: FunnelStage[]): void {
    this.data = [...stages];
  }

  exportImage(format: 'png' | 'svg' = 'png'): string {
    const svgEl = this.shadowRoot?.querySelector('.funnel__svg') as SVGElement | null;
    if (!svgEl) return '';

    if (format === 'svg') {
      const serializer = new XMLSerializer();
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serializer.serializeToString(svgEl));
    }

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const bbox = svgEl.getBoundingClientRect();
    canvas.width = bbox.width * 2;
    canvas.height = bbox.height * 2;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }

  @render()
  renderContent() {
    const svgString = this.orientation === 'horizontal'
      ? this.buildHorizontalSVG()
      : this.buildVerticalSVG();

    return html/*html*/`
      <div class="funnel"
           @click=${(e: MouseEvent) => this.handleSvgClick(e)}
           @mousemove=${(e: MouseEvent) => this.handleSvgMouseMove(e)}
           @mouseleave=${() => this.handleSvgMouseLeave()}
           @keydown=${(e: KeyboardEvent) => this.handleSvgKeyDown(e)}>
        ${unsafeHTML(svgString)}
        <if ${this.tooltipVisible}>
          <div class="funnel__tooltip" style="left:${this.tooltipX}px;top:${this.tooltipY}px;transform:translate(-50%,-100%)">
            <div class="funnel__tooltip-label">${this.tooltipText}</div>
            <div class="funnel__tooltip-value">${this.tooltipSubtext}</div>
          </div>
        </if>
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
    'snice-funnel': SniceFunnel;
  }
}
