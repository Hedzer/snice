import { element, property, dispatch, ready, dispose, render, styles, html, css } from 'snice';
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
  @property({ type: Object })
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

  // Private reactive state (using @property to trigger re-renders)
  @property({ type: Array }) private _drillPathState: TreemapNode[] = [];
  @property() private _tooltipText = '';
  @property({ type: Number }) private _tooltipX = 0;
  @property({ type: Number }) private _tooltipY = 0;
  @property({ type: Boolean }) private _tooltipVisible = false;
  @property({ type: Number }) private _width = 600;
  @property({ type: Number }) private _height = 400;

  private _resizeObserver: ResizeObserver | null = null;
  private _rects: TreemapRect[] = [];

  get drillPath(): TreemapNode[] {
    return this._drillPathState;
  }

  @dispatch('@snice/treemap-click', { bubbles: true, composed: true })
  private emitClick(node: TreemapNode, depth: number) {
    return { node, depth };
  }

  @dispatch('@snice/treemap-hover', { bubbles: true, composed: true })
  private emitHover(detail: { node: TreemapNode; depth: number } | null) {
    return detail;
  }

  @dispatch('@snice/treemap-drill', { bubbles: true, composed: true })
  private emitDrill(node: TreemapNode, path: TreemapNode[]) {
    return { node, path };
  }

  @ready()
  init() {
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
    });
    this._resizeObserver.observe(this);
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
    }
  }

  drillUp(): void {
    if (this._drillPathState.length > 0) {
      this._drillPathState = this._drillPathState.slice(0, -1);
      const current = this._drillPathState.length > 0
        ? this._drillPathState[this._drillPathState.length - 1]
        : this.data;
      this.emitDrill(current, this._drillPathState);
    }
  }

  drillToRoot(): void {
    this._drillPathState = [];
    this.emitDrill(this.data, []);
  }

  private getCurrentNode(): TreemapNode {
    if (this._drillPathState.length > 0) {
      return this._drillPathState[this._drillPathState.length - 1];
    }
    return this.data;
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

  private renderRectGroup(rect: TreemapRect, index: number) {
    const color = rect.node.color || this.getColor(rect.colorIndex);
    const showLabel = this.showLabels && this.canFitLabel(rect);
    const showValue = this.showValues && this.canFitValue(rect);
    const fontSize = this.getLabelFontSize(rect);
    const cx = rect.x + rect.width / 2;
    const labelY = showValue ? rect.y + rect.height / 2 - fontSize * 0.4 : rect.y + rect.height / 2;
    const valueY = showLabel ? rect.y + rect.height / 2 + fontSize * 0.8 : rect.y + rect.height / 2;

    return html`
      <rect
        class="treemap__rect"
        data-index="${index}"
        x="${rect.x}"
        y="${rect.y}"
        width="${rect.width}"
        height="${rect.height}"
        fill="${color}"
        @click=${(e: Event) => {
          e.stopPropagation();
          this.emitClick(rect.node, rect.depth);
          if (rect.node.children && rect.node.children.length > 0) {
            this.drillDown(rect.node);
          }
        }}
        @mouseenter=${() => {
          this._tooltipText = `${rect.node.label}: ${sumValues(rect.node).toLocaleString()}`;
          this._tooltipX = rect.x + rect.width / 2;
          this._tooltipY = rect.y;
          this._tooltipVisible = true;
          this.emitHover({ node: rect.node, depth: rect.depth });
        }}
        @mouseleave=${() => {
          this._tooltipVisible = false;
          this.emitHover(null);
        }}
      />
      <rect
        class="treemap__rect-stroke"
        x="${rect.x}"
        y="${rect.y}"
        width="${rect.width}"
        height="${rect.height}"
      />
      ${showLabel ? html`
        <text
          class="treemap__label"
          x="${cx}"
          y="${labelY}"
          style="font-size: ${fontSize}px"
        >${rect.node.label}</text>
      ` : html``}
      ${showValue ? html`
        <text
          class="treemap__value"
          x="${cx}"
          y="${valueY}"
        >${sumValues(rect.node).toLocaleString()}</text>
      ` : html``}
    `;
  }

  private renderBreadcrumbs() {
    const hasDrill = this._drillPathState.length > 0;
    if (!hasDrill) return html``;

    const items: any[] = [];

    items.push(html`
      <button class="treemap__breadcrumb" @click=${() => this.drillToRoot()}>
        ${this.data.label || 'Root'}
      </button>
    `);

    for (let i = 0; i < this._drillPathState.length; i++) {
      const node = this._drillPathState[i];
      const isLast = i === this._drillPathState.length - 1;

      items.push(html`<span class="treemap__separator">/</span>`);

      if (isLast) {
        items.push(html`
          <span class="treemap__breadcrumb treemap__breadcrumb--current">
            ${node.label}
          </span>
        `);
      } else {
        const drillIndex = i;
        items.push(html`
          <button class="treemap__breadcrumb" @click=${() => {
            this._drillPathState = this._drillPathState.slice(0, drillIndex + 1);
            this.emitDrill(node, this._drillPathState);
          }}>
            ${node.label}
          </button>
        `);
      }
    }

    return html`<div class="treemap__breadcrumbs">${items}</div>`;
  }

  @render()
  renderContent() {
    this._rects = this.computeRects();

    const dataLabel = this.data?.label || 'Treemap';
    const tooltipLeft = `${(this._tooltipX / this._width) * 100}%`;
    const tooltipTop = `${(this._tooltipY / this._height) * 100}%`;
    const tooltipClass = this._tooltipVisible ? 'treemap__tooltip treemap__tooltip--visible' : 'treemap__tooltip';

    return html/*html*/`
      ${this.renderBreadcrumbs()}
      <div class="treemap" role="img" aria-label="${dataLabel}">
        <svg class="treemap__svg"
             viewBox="0 0 ${this._width} ${this._height}"
             preserveAspectRatio="none">
          ${this._rects.map((rect, i) => this.renderRectGroup(rect, i))}
        </svg>
        <div class="${tooltipClass}"
             style="left: ${tooltipLeft}; top: ${tooltipTop}">
          ${this._tooltipText}
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
