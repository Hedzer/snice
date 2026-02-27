import { element, property, dispatch, ready, dispose, watch, query, render, styles, html, css } from 'snice';
import cssContent from './snice-treemap.css?inline';
import type { TreemapNode, TreemapColorScheme, TreemapRect, SniceTreemapElement } from './snice-treemap.types';

const COLOR_SCHEMES: Record<TreemapColorScheme, string[]> = {
  default: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'],
  blue: ['#08519c', '#3182bd', '#6baed6', '#9ecae1', '#2171b5', '#4292c6', '#6baed6', '#c6dbef'],
  green: ['#006d2c', '#31a354', '#74c476', '#a1d99b', '#238b45', '#41ab5d', '#74c476', '#c7e9c0'],
  purple: ['#54278f', '#756bb1', '#9e9ac8', '#bcbddc', '#6a51a3', '#807dba', '#9e9ac8', '#dadaeb'],
  orange: ['#d94701', '#fd8d3c', '#fdae6b', '#fdd0a2', '#e6550d', '#f16913', '#fd8d3c', '#fee6ce'],
  warm: ['#b30000', '#e34a33', '#fc8d59', '#fdcc8a', '#d7301f', '#ef6548', '#fc8d59', '#fef0d9'],
  cool: ['#016c59', '#1c9099', '#67a9cf', '#a6bddb', '#02818a', '#3690c0', '#67a9cf', '#d0d1e6'],
  rainbow: ['#e41a1c', '#ff7f00', '#ffff33', '#4daf4a', '#377eb8', '#984ea3', '#a65628', '#f781bf'],
};

function sumValues(node: TreemapNode): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, child) => sum + sumValues(child), 0);
  }
  return Math.max(0, node.value);
}

function squarify(
  children: TreemapNode[],
  x: number,
  y: number,
  w: number,
  h: number,
  depth: number,
  colorOffset: number,
  padding: number
): TreemapRect[] {
  const totalValue = children.reduce((sum, c) => sum + sumValues(c), 0);
  if (totalValue <= 0 || w <= 0 || h <= 0) return [];

  const sorted = [...children].sort((a, b) => sumValues(b) - sumValues(a));
  const rects: TreemapRect[] = [];
  let remaining = sorted.slice();
  let cx = x;
  let cy = y;
  let cw = w;
  let ch = h;

  while (remaining.length > 0) {
    const isWide = cw >= ch;
    const side = isWide ? ch : cw;
    const totalRemaining = remaining.reduce((s, c) => s + sumValues(c), 0);

    const row: TreemapNode[] = [];
    let rowSum = 0;
    let worstRatio = Infinity;

    for (const child of remaining) {
      const childVal = sumValues(child);
      const testSum = rowSum + childVal;
      const testRow = [...row, child];

      const rowArea = (testSum / totalRemaining) * (cw * ch);
      const rowSide = rowArea / side;
      let testWorst = 0;
      for (const r of testRow) {
        const rArea = (sumValues(r) / testSum) * rowArea;
        const rSide = rArea / rowSide;
        const ratio = Math.max(rSide / rowSide, rowSide / rSide);
        testWorst = Math.max(testWorst, ratio);
      }

      if (testWorst <= worstRatio || row.length === 0) {
        row.push(child);
        rowSum = testSum;
        worstRatio = testWorst;
      } else {
        break;
      }
    }

    const rowArea = (rowSum / totalRemaining) * (cw * ch);
    const rowSide = side > 0 ? rowArea / side : 0;

    let offset = 0;
    for (let i = 0; i < row.length; i++) {
      const node = row[i];
      const nodeVal = sumValues(node);
      const nodeSize = rowSum > 0 ? (nodeVal / rowSum) * side : 0;

      let rx: number, ry: number, rw: number, rh: number;
      if (isWide) {
        rx = cx;
        ry = cy + offset;
        rw = rowSide;
        rh = nodeSize;
      } else {
        rx = cx + offset;
        ry = cy;
        rw = nodeSize;
        rh = rowSide;
      }

      const colorIndex = colorOffset + rects.length + i;

      const px = Math.min(padding, rw / 4);
      const py = Math.min(padding, rh / 4);

      rects.push({
        x: rx + px,
        y: ry + py,
        width: Math.max(0, rw - px * 2),
        height: Math.max(0, rh - py * 2),
        node,
        depth,
        colorIndex,
      });

      offset += nodeSize;
    }

    if (isWide) {
      cx += rowSide;
      cw -= rowSide;
    } else {
      cy += rowSide;
      ch -= rowSide;
    }

    remaining = remaining.slice(row.length);
  }

  return rects;
}

@element('snice-treemap')
export class SniceTreemap extends HTMLElement implements SniceTreemapElement {
  @property({ type: Object, attribute: false })
  data: TreemapNode = { label: '', value: 0 };

  @property({ type: Boolean, attribute: 'show-labels' })
  showLabels = true;

  @property({ type: Boolean, attribute: 'show-values' })
  showValues = false;

  @property({ attribute: 'color-scheme' })
  colorScheme: TreemapColorScheme = 'default';

  @property({ type: Number })
  padding = 2;

  @property({ type: Boolean })
  animation = true;

  @query('.treemap')
  private containerEl?: HTMLElement;

  @query('.treemap__chart')
  private chartEl?: HTMLElement;

  @query('.treemap__tooltip')
  private tooltipEl?: HTMLElement;

  @query('.treemap__breadcrumbs')
  private breadcrumbsEl?: HTMLElement;

  // Plain private fields — no @property, no re-renders
  private _drillPathState: TreemapNode[] = [];
  private _tooltipText = '';
  private _tooltipX = 0;
  private _tooltipY = 0;
  private _tooltipVisible = false;
  private _width = 600;
  private _height = 400;
  private _resizeObserver: ResizeObserver | null = null;
  private _rects: TreemapRect[] = [];
  private _cachedData: TreemapNode = { label: '', value: 0 };

  get drillPath(): TreemapNode[] {
    return this._drillPathState;
  }

  @dispatch('treemap-click', { bubbles: true, composed: true })
  private emitClick(node: TreemapNode, depth: number) {
    return { node, depth };
  }

  @dispatch('treemap-hover', { bubbles: true, composed: true })
  private emitHover(detail: { node: TreemapNode; depth: number } | null) {
    return detail;
  }

  @dispatch('treemap-drill', { bubbles: true, composed: true })
  private emitDrill(node: TreemapNode, path: TreemapNode[]) {
    return { node, path };
  }

  @ready()
  init() {
    this._cachedData = this.data;
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0) {
          this._width = cr.width;
          this._height = cr.height;
        } else if (cr.width > 0) {
          this._width = cr.width;
          this._height = cr.width * 0.667;
        }
      }
      this.rebuildChart();
    });
    this._resizeObserver.observe(this);
    this.rebuildChart();
  }

  @watch('data')
  onDataChange() {
    this._cachedData = this.data;
    this._drillPathState = [];
    this.rebuildChart();
  }

  @watch('showLabels', 'showValues', 'colorScheme', 'padding', 'animation')
  onDisplayChange() {
    this.rebuildChart();
  }

  @dispose()
  cleanup() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  drillDown(node: TreemapNode): void {
    if (node.children && node.children.length > 0) {
      this._drillPathState = [...this._drillPathState, node];
      this.emitDrill(node, this._drillPathState);
      this.rebuildChart();
    }
  }

  drillUp(): void {
    if (this._drillPathState.length > 0) {
      this._drillPathState = this._drillPathState.slice(0, -1);
      const current = this._drillPathState.length > 0
        ? this._drillPathState[this._drillPathState.length - 1]
        : this._cachedData;
      this.emitDrill(current, this._drillPathState);
      this.rebuildChart();
    }
  }

  drillToRoot(): void {
    this._drillPathState = [];
    this.emitDrill(this._cachedData, []);
    this.rebuildChart();
  }

  private getCurrentNode(): TreemapNode {
    if (this._drillPathState.length > 0) {
      return this._drillPathState[this._drillPathState.length - 1];
    }
    return this._cachedData;
  }

  private getColor(index: number): string {
    const colors = COLOR_SCHEMES[this.colorScheme] || COLOR_SCHEMES.default;
    return colors[index % colors.length];
  }

  private computeRects(): TreemapRect[] {
    const current = this.getCurrentNode();
    const children = current.children;
    if (!children || children.length === 0) return [];
    return squarify(children, 0, 0, this._width, this._height, 0, 0, this.padding);
  }

  private canFitLabel(rect: TreemapRect): boolean {
    return rect.width > 30 && rect.height > 16;
  }

  private canFitValue(rect: TreemapRect): boolean {
    return rect.width > 30 && rect.height > 30;
  }

  private getLabelFontSize(rect: TreemapRect): number {
    const maxByWidth = rect.width / 8;
    const maxByHeight = rect.height / 3;
    return Math.min(Math.max(Math.min(maxByWidth, maxByHeight), 8), 16);
  }

  /** Rebuild the entire SVG chart via innerHTML on the chart container */
  private rebuildChart() {
    if (!this.chartEl) {
      requestAnimationFrame(() => this.rebuildChart());
      return;
    }

    this._rects = this.computeRects();

    let svg = '';
    svg += `<svg class="treemap__svg" viewBox="0 0 ${this._width} ${this._height}" preserveAspectRatio="none">`;

    for (let i = 0; i < this._rects.length; i++) {
      svg += this.buildRectGroup(this._rects[i], i);
    }

    svg += '</svg>';
    this.chartEl.innerHTML = svg;

    // Attach event listeners to rects
    const rectEls = this.chartEl.querySelectorAll('.treemap__rect');
    rectEls.forEach((el) => {
      const index = Number((el as HTMLElement).dataset.index);
      const rect = this._rects[index];
      if (!rect) return;

      el.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.emitClick(rect.node, rect.depth);
        if (rect.node.children && rect.node.children.length > 0) {
          this.drillDown(rect.node);
        }
      });

      el.addEventListener('mouseenter', () => {
        this._tooltipText = `${rect.node.label}: ${sumValues(rect.node).toLocaleString()}`;
        this._tooltipX = rect.x + rect.width / 2;
        this._tooltipY = rect.y;
        this._tooltipVisible = true;
        this.updateTooltipDOM();
        this.emitHover({ node: rect.node, depth: rect.depth });
      });

      el.addEventListener('mouseleave', () => {
        this._tooltipVisible = false;
        this.updateTooltipDOM();
        this.emitHover(null);
      });
    });

    this.rebuildBreadcrumbs();
  }

  private buildRectGroup(rect: TreemapRect, index: number): string {
    const color = rect.node.color || this.getColor(rect.colorIndex);
    const showLabel = this.showLabels && this.canFitLabel(rect);
    const showValue = this.showValues && this.canFitValue(rect);
    const fontSize = this.getLabelFontSize(rect);
    const cx = rect.x + rect.width / 2;
    const labelY = showValue ? rect.y + rect.height / 2 - fontSize * 0.4 : rect.y + rect.height / 2;
    const valueY = showLabel ? rect.y + rect.height / 2 + fontSize * 0.8 : rect.y + rect.height / 2;

    let parts = '';

    parts += `<rect class="treemap__rect" data-index="${index}" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${color}" />`;
    parts += `<rect class="treemap__rect-stroke" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" />`;

    if (showLabel) {
      parts += `<text class="treemap__label" x="${cx}" y="${labelY}" style="font-size: ${fontSize}px">${rect.node.label}</text>`;
    }

    if (showValue) {
      parts += `<text class="treemap__value" x="${cx}" y="${valueY}">${sumValues(rect.node).toLocaleString()}</text>`;
    }

    return parts;
  }

  /** Update tooltip element directly */
  private updateTooltipDOM() {
    const tooltip = this.tooltipEl;
    if (!tooltip) return;

    if (!this._tooltipVisible) {
      tooltip.classList.remove('treemap__tooltip--visible');
      return;
    }

    const tooltipLeft = `${(this._tooltipX / this._width) * 100}%`;
    const tooltipTop = `${(this._tooltipY / this._height) * 100}%`;
    tooltip.style.left = tooltipLeft;
    tooltip.style.top = tooltipTop;
    tooltip.textContent = this._tooltipText;
    tooltip.classList.add('treemap__tooltip--visible');
  }

  /** Rebuild breadcrumbs via innerHTML */
  private rebuildBreadcrumbs() {
    const el = this.breadcrumbsEl;
    if (!el) return;

    if (this._drillPathState.length === 0) {
      el.innerHTML = '';
      el.style.display = 'none';
      return;
    }

    el.style.display = '';
    let html = '';

    html += `<button class="treemap__breadcrumb" data-drill-root>${this._cachedData.label || 'Root'}</button>`;

    for (let i = 0; i < this._drillPathState.length; i++) {
      const node = this._drillPathState[i];
      const isLast = i === this._drillPathState.length - 1;

      html += '<span class="treemap__separator">/</span>';

      if (isLast) {
        html += `<span class="treemap__breadcrumb treemap__breadcrumb--current">${node.label}</span>`;
      } else {
        html += `<button class="treemap__breadcrumb" data-drill-index="${i}">${node.label}</button>`;
      }
    }

    el.innerHTML = html;

    // Attach breadcrumb event listeners
    const rootBtn = el.querySelector('[data-drill-root]');
    if (rootBtn) {
      rootBtn.addEventListener('click', () => this.drillToRoot());
    }

    el.querySelectorAll('[data-drill-index]').forEach((btn) => {
      const idx = Number((btn as HTMLElement).dataset.drillIndex);
      btn.addEventListener('click', () => {
        const node = this._drillPathState[idx];
        this._drillPathState = this._drillPathState.slice(0, idx + 1);
        this.emitDrill(node, this._drillPathState);
        this.rebuildChart();
      });
    });
  }

  @render({ once: true })
  renderContent() {
    const dataLabel = this._cachedData?.label || 'Treemap';

    return html/*html*/`
      <div class="treemap__breadcrumbs" part="breadcrumbs" style="display: none"></div>
      <div class="treemap" part="base" role="img" aria-label="${dataLabel}">
        <div class="treemap__chart" part="chart"></div>
        <div class="treemap__tooltip" part="tooltip"></div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
