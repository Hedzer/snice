import { element, property, render, styles, dispatch, ready, dispose, html, css } from 'snice';
import cssContent from './snice-sankey.css?inline';
import type {
  SankeyData, SankeyAlignment, SankeyLayoutNode, SankeyLayoutLink,
  SankeyNode, SankeyLink, SniceSankeyElement
} from './snice-sankey.types';

const DEFAULT_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0',
  '#00bcd4', '#8bc34a', '#ffc107', '#e91e63', '#673ab7'
];

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

  private layoutNodes: SankeyLayoutNode[] = [];
  private layoutLinks: SankeyLayoutLink[] = [];
  private hoveredNodeId: string | null = null;
  private hoveredLinkIndex: number | null = null;
  private tooltipText = '';
  private tooltipSubtext = '';
  private tooltipX = 0;
  private tooltipY = 0;
  private tooltipVisible = false;
  private chartWidth = 600;
  private chartHeight = 400;
  private resizeObserver: ResizeObserver | null = null;

  @property({ type: Number, attribute: false })
  private renderTrigger = 0;


  @dispatch('@snice/sankey-node-click', { bubbles: true, composed: true })
  private emitNodeClick(node: SankeyNode) {
    return { node };
  }

  @dispatch('@snice/sankey-link-click', { bubbles: true, composed: true })
  private emitLinkClick(link: SankeyLink) {
    return { link };
  }

  @dispatch('@snice/sankey-hover', { bubbles: true, composed: true })
  private emitHover(detail: { type: 'node' | 'link'; item: SankeyNode | SankeyLink } | null) {
    return detail;
  }

  @ready()
  init() {
    const rect = this.getBoundingClientRect();
    if (rect.width > 0) this.chartWidth = rect.width;
    if (rect.height > 0) this.chartHeight = rect.height;
    this.computeLayout();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.chartWidth = width;
            this.chartHeight = height;
            this.computeLayout();
          }
        }
      });
      this.resizeObserver.observe(this);
    }
  }


  private computeLayout() {
    if (!this.data || !this.data.nodes.length || !this.data.links.length) {
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
    this.data.nodes.forEach((n, i) => {
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
    const links: SankeyLayoutLink[] = this.data.links.map(l => ({
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
    const totalValue = Math.max(...nodes.map(n => n.value), 1);
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

  private handleNodeClick(node: SankeyLayoutNode) {
    const originalNode = this.data.nodes.find(n => n.id === node.id);
    if (originalNode) {
      this.emitNodeClick(originalNode);
    }
  }

  private handleLinkClick(link: SankeyLayoutLink, index: number) {
    const originalLink = this.data.links[index];
    if (originalLink) {
      this.emitLinkClick(originalLink);
    }
  }

  private handleNodeHover(node: SankeyLayoutNode | null, e?: MouseEvent) {
    if (node) {
      this.hoveredNodeId = node.id;
      this.hoveredLinkIndex = null;
      this.tooltipText = node.label;
      this.tooltipSubtext = `Value: ${node.value.toLocaleString()}`;
      this.updateTooltipPosition(e);
      this.tooltipVisible = true;
      const originalNode = this.data.nodes.find(n => n.id === node.id);
      if (originalNode) {
        this.emitHover({ type: 'node', item: originalNode });
      }
    } else {
      this.hoveredNodeId = null;
      this.tooltipVisible = false;
      this.emitHover(null);
    }
    this.renderTrigger++;
  }

  private handleLinkHover(link: SankeyLayoutLink | null, index: number, e?: MouseEvent) {
    if (link) {
      this.hoveredLinkIndex = index;
      this.hoveredNodeId = null;
      this.tooltipText = `${link.source.label} → ${link.target.label}`;
      this.tooltipSubtext = `Value: ${link.value.toLocaleString()}`;
      this.updateTooltipPosition(e);
      this.tooltipVisible = true;
      const originalLink = this.data.links[index];
      if (originalLink) {
        this.emitHover({ type: 'link', item: originalLink });
      }
    } else {
      this.hoveredLinkIndex = null;
      this.tooltipVisible = false;
      this.emitHover(null);
    }
    this.renderTrigger++;
  }

  private updateTooltipPosition(e?: MouseEvent) {
    if (!e) return;
    const rect = this.getBoundingClientRect();
    this.tooltipX = e.clientX - rect.left + 10;
    this.tooltipY = e.clientY - rect.top - 10;
  }

  private isNodeHighlighted(node: SankeyLayoutNode): boolean {
    if (this.hoveredNodeId === null && this.hoveredLinkIndex === null) return false;
    if (this.hoveredNodeId === node.id) return true;
    if (this.hoveredLinkIndex !== null) {
      const link = this.layoutLinks[this.hoveredLinkIndex];
      return link?.source.id === node.id || link?.target.id === node.id;
    }
    // Highlight connected nodes
    if (this.hoveredNodeId) {
      return this.layoutLinks.some(l =>
        (l.source.id === this.hoveredNodeId && l.target.id === node.id) ||
        (l.target.id === this.hoveredNodeId && l.source.id === node.id)
      );
    }
    return false;
  }

  private isLinkHighlighted(link: SankeyLayoutLink, index: number): boolean {
    if (this.hoveredNodeId === null && this.hoveredLinkIndex === null) return false;
    if (this.hoveredLinkIndex === index) return true;
    if (this.hoveredNodeId) {
      return link.source.id === this.hoveredNodeId || link.target.id === this.hoveredNodeId;
    }
    return false;
  }

  private get isDimmed(): boolean {
    return this.hoveredNodeId !== null || this.hoveredLinkIndex !== null;
  }

  @render()
  renderContent() {
    this.computeLayout();
    const hasData = this.layoutNodes.length > 0;
    const isDimmed = this.isDimmed;

    return html/*html*/`
      <div class="sankey ${isDimmed ? 'sankey--dimmed' : ''}"
           role="img"
           aria-label="Sankey diagram"
           @mouseleave=${() => { this.handleNodeHover(null); this.handleLinkHover(null, -1); }}>
        <if ${hasData}>
          <svg class="sankey__svg"
               viewBox="0 0 ${this.chartWidth} ${this.chartHeight}"
               preserveAspectRatio="xMidYMid meet">
            <g class="sankey__links">
              ${this.layoutLinks.map((link, i) => html/*html*/`
                <g class="sankey__link ${this.isLinkHighlighted(link, i) ? 'sankey__link--highlighted' : ''}"
                   @click=${() => this.handleLinkClick(link, i)}
                   @mouseenter=${(e: MouseEvent) => this.handleLinkHover(link, i, e)}
                   @mousemove=${(e: MouseEvent) => this.updateTooltipPosition(e)}
                   @mouseleave=${() => this.handleLinkHover(null, -1)}>
                  <path d="${this.getLinkPath(link)}"
                        stroke="${link.color}"
                        stroke-width="${Math.max(1, link.width)}" />
                </g>
              `)}
            </g>
            <g class="sankey__nodes">
              ${this.layoutNodes.map(node => html/*html*/`
                <g class="sankey__node ${this.isNodeHighlighted(node) ? 'sankey__node--highlighted' : ''}"
                   @click=${() => this.handleNodeClick(node)}
                   @mouseenter=${(e: MouseEvent) => this.handleNodeHover(node, e)}
                   @mousemove=${(e: MouseEvent) => this.updateTooltipPosition(e)}
                   @mouseleave=${() => this.handleNodeHover(null)}>
                  <rect x="${node.x}" y="${node.y}"
                        width="${node.width}" height="${Math.max(node.height, 2)}"
                        fill="${node.color}" />
                  <if ${this.showLabels}>
                    ${node.depth === 0
                      ? html/*html*/`<text class="sankey__label"
                              x="${node.x - 6}"
                              y="${node.y + node.height / 2}"
                              text-anchor="end">${node.label}</text>`
                      : html/*html*/`<text class="sankey__label"
                              x="${node.x + node.width + 6}"
                              y="${node.y + node.height / 2}"
                              text-anchor="start">${node.label}</text>`
                    }
                  </if>
                  <if ${this.showValues && node.height > 12}>
                    ${node.depth === 0
                      ? html/*html*/`<text class="sankey__value"
                              x="${node.x - 6}"
                              y="${node.y + node.height / 2 + 12}"
                              text-anchor="end">${node.value.toLocaleString()}</text>`
                      : html/*html*/`<text class="sankey__value"
                              x="${node.x + node.width + 6}"
                              y="${node.y + node.height / 2 + 12}"
                              text-anchor="start">${node.value.toLocaleString()}</text>`
                    }
                  </if>
                </g>
              `)}
            </g>
          </svg>
        </if>
        <div class="sankey__tooltip ${this.tooltipVisible ? 'sankey__tooltip--visible' : ''}"
             style="left: ${this.tooltipX}px; top: ${this.tooltipY}px;">
          <div class="sankey__tooltip-label">${this.tooltipText}</div>
          <div class="sankey__tooltip-value">${this.tooltipSubtext}</div>
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
