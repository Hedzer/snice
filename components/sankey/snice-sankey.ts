import { element, property, render, styles, dispatch, ready, dispose, watch, query, html, css } from 'snice';
import cssContent from './snice-sankey.css?inline';
import type {
  SankeyData, SankeyAlignment, SankeyLayoutNode, SankeyLayoutLink,
  SankeyNode, SankeyLink, SniceSankeyElement
} from './snice-sankey.types';

const DEFAULT_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0',
  '#00bcd4', '#8bc34a', '#ffc107', '#e91e63', '#673ab7'
];

function escapeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

@element('snice-sankey')
export class SniceSankey extends HTMLElement implements SniceSankeyElement {
  @property({ type: Object, attribute: false })
  data: SankeyData = { nodes: [], links: [] };

  @property({ type: Number, attribute: 'node-width' })
  nodeWidth = 20;

  @property({ type: Number, attribute: 'node-padding' })
  nodePadding = 10;

  @property()
  alignment: SankeyAlignment = 'justify';

  @property({ type: Boolean, attribute: 'show-labels' })
  showLabels = true;

  @property({ type: Boolean, attribute: 'show-values' })
  showValues = true;

  @property({ type: Boolean })
  animation = false;

  @query('.sankey__chart')
  private chartEl?: HTMLElement;

  @query('.sankey__tooltip')
  private tooltipEl?: HTMLElement;

  private cachedData: SankeyData = { nodes: [], links: [] };
  private layoutNodes: SankeyLayoutNode[] = [];
  private layoutLinks: SankeyLayoutLink[] = [];
  private hoveredNodeId: string | null = null;
  private hoveredLinkIndex: number | null = null;
  private chartWidth = 600;
  private chartHeight = 400;
  private resizeObserver: ResizeObserver | null = null;

  @dispatch('sankey-node-click', { bubbles: true, composed: true })
  private emitNodeClick(node: SankeyNode) {
    return { node };
  }

  @dispatch('sankey-link-click', { bubbles: true, composed: true })
  private emitLinkClick(link: SankeyLink) {
    return { link };
  }

  @dispatch('sankey-hover', { bubbles: true, composed: true })
  private emitHover(detail: { type: 'node' | 'link'; item: SankeyNode | SankeyLink } | null) {
    return detail;
  }

  @ready()
  init() {
    const rect = this.getBoundingClientRect();
    if (rect.width > 0) this.chartWidth = rect.width;
    if (rect.height > 0) this.chartHeight = rect.height;

    if (this.cachedData.nodes.length === 0 && this.data.nodes.length > 0) {
      this.cachedData = this.data;
    }
    this.computeLayout();
    this.rebuildChart();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.chartWidth = width;
            this.chartHeight = height;
            this.computeLayout();
            this.rebuildChart();
          }
        }
      });
      this.resizeObserver.observe(this);
    }
  }

  @watch('data')
  onDataChange() {
    this.cachedData = this.data;
    this.computeLayout();
    this.rebuildChart();
  }

  @watch('showLabels', 'showValues', 'animation', 'alignment')
  onDisplayChange() {
    this.computeLayout();
    this.rebuildChart();
  }

  private computeLayout() {
    const data = this.cachedData;
    if (!data || !data.nodes.length || !data.links.length) {
      this.layoutNodes = [];
      this.layoutLinks = [];
      return;
    }

    const padding = 40;
    const labelSpace = this.showLabels ? 80 : 0;
    const width = this.chartWidth - labelSpace * 2;
    const height = this.chartHeight - padding * 2;

    if (width <= 0 || height <= 0) return;

    // Build node map
    const nodeMap = new Map<string, SankeyLayoutNode>();
    data.nodes.forEach((n, i) => {
      nodeMap.set(n.id, {
        id: n.id,
        label: n.label || n.id,
        color: n.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        x: 0, y: 0,
        width: this.nodeWidth,
        height: 0,
        value: 0,
        depth: 0,
        sourceLinks: [],
        targetLinks: []
      });
    });

    // Build links
    const links: SankeyLayoutLink[] = data.links.map(l => ({
      source: nodeMap.get(l.source)!,
      target: nodeMap.get(l.target)!,
      value: l.value,
      color: l.color || nodeMap.get(l.source)?.color || DEFAULT_COLORS[0],
      width: 0,
      sy: 0,
      ty: 0
    })).filter(l => l.source && l.target);

    // Assign links to nodes
    links.forEach(link => {
      link.source.sourceLinks.push(link);
      link.target.targetLinks.push(link);
    });

    // Calculate node values
    nodeMap.forEach(node => {
      const sourceTotal = node.sourceLinks.reduce((s, l) => s + l.value, 0);
      const targetTotal = node.targetLinks.reduce((s, l) => s + l.value, 0);
      node.value = Math.max(sourceTotal, targetTotal);
    });

    // Compute depths using BFS
    this.computeDepths(nodeMap);

    const nodes = Array.from(nodeMap.values());
    const maxDepth = Math.max(...nodes.map(n => n.depth));

    // X positions
    const xScale = maxDepth > 0 ? (width - this.nodeWidth) / maxDepth : 0;
    nodes.forEach(node => {
      node.x = labelSpace + node.depth * xScale;
    });

    // Apply alignment
    this.applyAlignment(nodes, maxDepth, width, labelSpace);

    // Y positions - compute node heights and stack within each column
    const columns = this.getColumns(nodes);

    columns.forEach(column => {
      const colTotalValue = column.reduce((s, n) => s + n.value, 0);
      const availableHeight = height - (column.length - 1) * this.nodePadding;
      const scale = colTotalValue > 0 ? availableHeight / colTotalValue : 0;

      let y = padding;
      column.forEach(node => {
        node.y = y;
        node.height = Math.max(node.value * scale, 2);
        y += node.height + this.nodePadding;
      });
    });

    // Iterative relaxation for better node positioning
    for (let i = 0; i < 32; i++) {
      this.relaxColumns(columns, height, padding);
    }

    // Compute link positions
    links.forEach(link => {
      link.width = Math.max(1, (link.value / link.source.value) * link.source.height);
    });

    // Sort and position source links
    nodes.forEach(node => {
      node.sourceLinks.sort((a, b) => a.target.y - b.target.y);
      let sy = 0;
      node.sourceLinks.forEach(link => {
        link.sy = node.y + sy;
        sy += link.width;
      });

      node.targetLinks.sort((a, b) => a.source.y - b.source.y);
      let ty = 0;
      node.targetLinks.forEach(link => {
        link.width = Math.max(1, (link.value / link.target.value) * link.target.height);
        link.ty = node.y + ty;
        ty += link.width;
      });
    });

    this.layoutNodes = nodes;
    this.layoutLinks = links;
  }

  private computeDepths(nodeMap: Map<string, SankeyLayoutNode>) {
    const remaining = new Set(nodeMap.values());
    let depth = 0;

    while (remaining.size > 0) {
      const nextLevel: SankeyLayoutNode[] = [];
      remaining.forEach(node => {
        if (node.targetLinks.every(l => !remaining.has(l.source))) {
          node.depth = depth;
          nextLevel.push(node);
        }
      });
      if (nextLevel.length === 0) {
        // Break cycles - assign remaining to current depth
        remaining.forEach(node => {
          node.depth = depth;
        });
        break;
      }
      nextLevel.forEach(n => remaining.delete(n));
      depth++;
    }
  }

  private getColumns(nodes: SankeyLayoutNode[]): SankeyLayoutNode[][] {
    const maxDepth = Math.max(...nodes.map(n => n.depth), 0);
    const columns: SankeyLayoutNode[][] = [];
    for (let i = 0; i <= maxDepth; i++) {
      columns.push(nodes.filter(n => n.depth === i));
    }
    return columns;
  }

  private applyAlignment(nodes: SankeyLayoutNode[], maxDepth: number, width: number, labelSpace: number) {
    if (this.alignment === 'right') {
      nodes.forEach(node => {
        if (node.sourceLinks.length === 0) {
          node.depth = maxDepth;
          node.x = labelSpace + maxDepth * ((width - this.nodeWidth) / Math.max(maxDepth, 1));
        }
      });
    } else if (this.alignment === 'center') {
      nodes.forEach(node => {
        if (node.targetLinks.length === 0 && node.sourceLinks.length === 0) {
          node.depth = Math.floor(maxDepth / 2);
          node.x = labelSpace + node.depth * ((width - this.nodeWidth) / Math.max(maxDepth, 1));
        }
      });
    } else if (this.alignment === 'justify') {
      nodes.forEach(node => {
        if (node.sourceLinks.length === 0 && maxDepth > 0) {
          node.depth = maxDepth;
          node.x = labelSpace + maxDepth * ((width - this.nodeWidth) / maxDepth);
        }
      });
    }
  }

  private relaxColumns(columns: SankeyLayoutNode[][], height: number, padding: number) {
    // Forward pass - push nodes based on sources
    columns.forEach(column => {
      column.forEach(node => {
        if (node.targetLinks.length > 0) {
          const avg = node.targetLinks.reduce((s, l) => s + l.source.y, 0) / node.targetLinks.length;
          const delta = (avg - node.y) * 0.5;
          node.y += delta;
        }
      });
      this.resolveOverlaps(column, height, padding);
    });

    // Backward pass - push nodes based on targets
    for (let i = columns.length - 1; i >= 0; i--) {
      columns[i].forEach(node => {
        if (node.sourceLinks.length > 0) {
          const avg = node.sourceLinks.reduce((s, l) => s + l.target.y, 0) / node.sourceLinks.length;
          const delta = (avg - node.y) * 0.5;
          node.y += delta;
        }
      });
      this.resolveOverlaps(columns[i], height, padding);
    }
  }

  private resolveOverlaps(column: SankeyLayoutNode[], height: number, padding: number) {
    column.sort((a, b) => a.y - b.y);

    let y0 = padding;
    column.forEach(node => {
      if (node.y < y0) {
        node.y = y0;
      }
      y0 = node.y + node.height + this.nodePadding;
    });

    // Push up if exceeding bottom
    const lastNode = column[column.length - 1];
    if (lastNode) {
      const overflow = lastNode.y + lastNode.height - (height + padding);
      if (overflow > 0) {
        lastNode.y -= overflow;
        for (let i = column.length - 2; i >= 0; i--) {
          const maxY = column[i + 1].y - column[i].height - this.nodePadding;
          if (column[i].y > maxY) {
            column[i].y = maxY;
          }
        }
      }
    }
  }

  private getLinkPath(link: SankeyLayoutLink): string {
    const x0 = link.source.x + link.source.width;
    const x1 = link.target.x;
    const xi = (x0 + x1) / 2;
    const y0 = link.sy + link.width / 2;
    const y1 = link.ty + link.width / 2;
    return `M${x0},${y0} C${xi},${y0} ${xi},${y1} ${x1},${y1}`;
  }

  private handleSvgClick(e: MouseEvent) {
    const target = e.target as SVGElement;
    const el = target.closest('[data-node-id]') as SVGElement | null;
    const linkEl = target.closest('[data-link-index]') as SVGElement | null;

    if (el) {
      const nodeId = el.dataset.nodeId!;
      const originalNode = this.cachedData.nodes.find(n => n.id === nodeId);
      if (originalNode) this.emitNodeClick(originalNode);
    } else if (linkEl) {
      const index = parseInt(linkEl.dataset.linkIndex!, 10);
      const originalLink = this.cachedData.links[index];
      if (originalLink) this.emitLinkClick(originalLink);
    }
  }

  private handleSvgMouseMove(e: MouseEvent) {
    const target = e.target as SVGElement;
    const nodeEl = target.closest('[data-node-id]') as SVGElement | null;
    const linkEl = target.closest('[data-link-index]') as SVGElement | null;
    const tooltip = this.tooltipEl;
    const chart = this.chartEl;

    if (nodeEl) {
      const nodeId = nodeEl.dataset.nodeId!;
      const node = this.layoutNodes.find(n => n.id === nodeId);
      if (!node) return;

      // Update hover highlight
      if (this.hoveredNodeId !== nodeId || this.hoveredLinkIndex !== null) {
        this.hoveredNodeId = nodeId;
        this.hoveredLinkIndex = null;
        this.applyHoverClasses();
      }

      // Update tooltip
      if (tooltip) {
        tooltip.querySelector('.sankey__tooltip-label')!.textContent = node.label;
        tooltip.querySelector('.sankey__tooltip-value')!.textContent = `Value: ${node.value.toLocaleString()}`;
        this.positionTooltip(e);
        tooltip.classList.add('sankey__tooltip--visible');
      }

      const originalNode = this.cachedData.nodes.find(n => n.id === nodeId);
      if (originalNode) this.emitHover({ type: 'node', item: originalNode });
    } else if (linkEl) {
      const index = parseInt(linkEl.dataset.linkIndex!, 10);
      const link = this.layoutLinks[index];
      if (!link) return;

      // Update hover highlight
      if (this.hoveredLinkIndex !== index || this.hoveredNodeId !== null) {
        this.hoveredLinkIndex = index;
        this.hoveredNodeId = null;
        this.applyHoverClasses();
      }

      // Update tooltip
      if (tooltip) {
        tooltip.querySelector('.sankey__tooltip-label')!.textContent = `${link.source.label} \u2192 ${link.target.label}`;
        tooltip.querySelector('.sankey__tooltip-value')!.textContent = `Value: ${link.value.toLocaleString()}`;
        this.positionTooltip(e);
        tooltip.classList.add('sankey__tooltip--visible');
      }

      const originalLink = this.cachedData.links[index];
      if (originalLink) this.emitHover({ type: 'link', item: originalLink });
    } else {
      this.clearHover();
    }
  }

  private handleSvgMouseLeave() {
    this.clearHover();
  }

  private clearHover() {
    if (this.hoveredNodeId !== null || this.hoveredLinkIndex !== null) {
      this.hoveredNodeId = null;
      this.hoveredLinkIndex = null;
      this.applyHoverClasses();
      this.emitHover(null);
    }
    const tooltip = this.tooltipEl;
    if (tooltip) tooltip.classList.remove('sankey__tooltip--visible');
  }

  private positionTooltip(e: MouseEvent) {
    const tooltip = this.tooltipEl;
    if (!tooltip) return;
    const rect = this.getBoundingClientRect();
    tooltip.style.left = `${e.clientX - rect.left + 10}px`;
    tooltip.style.top = `${e.clientY - rect.top - 10}px`;
  }

  private applyHoverClasses() {
    const chart = this.chartEl;
    if (!chart) return;
    const svg = chart.querySelector('svg');
    if (!svg) return;

    const isDimmed = this.hoveredNodeId !== null || this.hoveredLinkIndex !== null;
    const container = svg.closest('.sankey') as HTMLElement | null;
    if (container) {
      container.classList.toggle('sankey--dimmed', isDimmed);
    }

    // Update node highlights
    const nodeGroups = svg.querySelectorAll('[data-node-id]');
    nodeGroups.forEach(g => {
      const nodeId = (g as SVGElement).dataset.nodeId!;
      const highlighted = this.isNodeHighlighted(nodeId);
      g.classList.toggle('sankey__node--highlighted', highlighted);
    });

    // Update link highlights
    const linkGroups = svg.querySelectorAll('[data-link-index]');
    linkGroups.forEach(g => {
      const index = parseInt((g as SVGElement).dataset.linkIndex!, 10);
      const highlighted = this.isLinkHighlighted(index);
      g.classList.toggle('sankey__link--highlighted', highlighted);
    });
  }

  private isNodeHighlighted(nodeId: string): boolean {
    if (this.hoveredNodeId === null && this.hoveredLinkIndex === null) return false;
    if (this.hoveredNodeId === nodeId) return true;
    if (this.hoveredLinkIndex !== null) {
      const link = this.layoutLinks[this.hoveredLinkIndex];
      return link?.source.id === nodeId || link?.target.id === nodeId;
    }
    if (this.hoveredNodeId) {
      return this.layoutLinks.some(l =>
        (l.source.id === this.hoveredNodeId && l.target.id === nodeId) ||
        (l.target.id === this.hoveredNodeId && l.source.id === nodeId)
      );
    }
    return false;
  }

  private isLinkHighlighted(index: number): boolean {
    if (this.hoveredNodeId === null && this.hoveredLinkIndex === null) return false;
    if (this.hoveredLinkIndex === index) return true;
    if (this.hoveredNodeId) {
      const link = this.layoutLinks[index];
      return link?.source.id === this.hoveredNodeId || link?.target.id === this.hoveredNodeId;
    }
    return false;
  }

  private rebuildChart() {
    const chart = this.chartEl;
    if (!chart) {
      requestAnimationFrame(() => this.rebuildChart());
      return;
    }

    const hasData = this.layoutNodes.length > 0;
    if (!hasData) {
      chart.innerHTML = '';
      return;
    }

    chart.innerHTML = this.buildSVG();
  }

  private buildSVG(): string {
    const nodes = this.layoutNodes;
    const links = this.layoutLinks;

    let svg = `<svg class="sankey__svg" viewBox="0 0 ${this.chartWidth} ${this.chartHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Sankey diagram">`;

    // Links
    svg += `<g class="sankey__links">`;
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const path = escapeHTML(this.getLinkPath(link));
      const color = escapeHTML(link.color);
      svg += `<g class="sankey__link" data-link-index="${i}">`;
      svg += `<path d="${path}" stroke="${color}" stroke-width="${Math.max(1, link.width)}"/>`;
      svg += `</g>`;
    }
    svg += `</g>`;

    // Nodes
    svg += `<g class="sankey__nodes">`;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const color = escapeHTML(node.color);
      const nodeId = escapeHTML(node.id);
      svg += `<g class="sankey__node" data-node-id="${nodeId}">`;
      svg += `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${Math.max(node.height, 2)}" fill="${color}"/>`;

      if (this.showLabels) {
        const label = escapeHTML(node.label);
        if (node.depth === 0) {
          svg += `<text class="sankey__label" x="${node.x - 6}" y="${node.y + node.height / 2}" text-anchor="end">${label}</text>`;
        } else {
          svg += `<text class="sankey__label" x="${node.x + node.width + 6}" y="${node.y + node.height / 2}" text-anchor="start">${label}</text>`;
        }
      }

      if (this.showValues && node.height > 12) {
        const value = escapeHTML(node.value.toLocaleString());
        if (node.depth === 0) {
          svg += `<text class="sankey__value" x="${node.x - 6}" y="${node.y + node.height / 2 + 12}" text-anchor="end">${value}</text>`;
        } else {
          svg += `<text class="sankey__value" x="${node.x + node.width + 6}" y="${node.y + node.height / 2 + 12}" text-anchor="start">${value}</text>`;
        }
      }

      svg += `</g>`;
    }
    svg += `</g>`;

    svg += `</svg>`;
    return svg;
  }

  @render({ once: true })
  renderContent() {
    return html/*html*/`
      <div class="sankey"
           part="base"
           role="img"
           aria-label="Sankey diagram"
           @click=${(e: MouseEvent) => this.handleSvgClick(e)}
           @mousemove=${(e: MouseEvent) => this.handleSvgMouseMove(e)}
           @mouseleave=${() => this.handleSvgMouseLeave()}>
        <div class="sankey__chart" part="chart"></div>
        <div class="sankey__tooltip" part="tooltip">
          <div class="sankey__tooltip-label"></div>
          <div class="sankey__tooltip-value"></div>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @dispose()
  cleanup() {
    this.resizeObserver?.disconnect();
  }
}
