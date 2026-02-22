import { element, property, dispatch, query, render, styles, ready, dispose, watch, html, css } from 'snice';
import cssContent from './snice-network-graph.css?inline';
import type { NetworkNode, NetworkEdge, NetworkGraphData, LayoutType, SniceNetworkGraphElement } from './snice-network-graph.types';

interface SimNode extends NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
  degree: number;
}

interface SimEdge {
  source: SimNode;
  target: SimNode;
  edge: NetworkEdge;
}

const DEFAULT_COLORS = [
  'rgb(37 99 235)',   // blue
  'rgb(22 163 74)',   // green
  'rgb(234 88 12)',   // orange
  'rgb(220 38 38)',   // red
  'rgb(147 51 234)',  // purple
  'rgb(6 182 212)',   // cyan
  'rgb(236 72 153)',  // pink
  'rgb(245 158 11)',  // amber
  'rgb(20 184 166)',  // teal
  'rgb(99 102 241)',  // indigo
];

@element('snice-network-graph')
export class SniceNetworkGraph extends HTMLElement implements SniceNetworkGraphElement {
  @property({ type: Object, attribute: false })
  data: NetworkGraphData = { nodes: [], edges: [] };

  @property({ attribute: 'layout' })
  layout: LayoutType = 'force';

  @property({ type: Number, attribute: 'charge-strength' })
  chargeStrength = -300;

  @property({ type: Number, attribute: 'link-distance' })
  linkDistance = 80;

  @property({ type: Boolean, attribute: 'zoom-enabled' })
  zoomEnabled = true;

  @property({ type: Boolean, attribute: 'drag-enabled' })
  dragEnabled = true;

  @property({ type: Boolean, attribute: 'show-labels' })
  showLabels = true;

  @property({ type: Boolean })
  animation = true;

  @query('.network-graph__svg')
  private svgElement?: SVGSVGElement;

  private simNodes: SimNode[] = [];
  private simEdges: SimEdge[] = [];
  private animFrameId = 0;
  private simAlpha = 1;
  private simRunning = false;
  private simInitialized = false;

  // Zoom/pan state
  private zoomScale = 1;
  private panX = 0;
  private panY = 0;

  // Drag state
  private dragNode: SimNode | null = null;
  private dragStartX = 0;
  private dragStartY = 0;

  // Pan state
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private panStartPanX = 0;
  private panStartPanY = 0;

  // Hover state
  @property({ type: String, attribute: false })
  private hoveredNodeId = '';

  @property({ type: String, attribute: false })
  private tooltipText = '';

  @property({ type: Number, attribute: false })
  private tooltipX = 0;

  @property({ type: Number, attribute: false })
  private tooltipY = 0;

  @property({ type: Boolean, attribute: false })
  private tooltipVisible = false;

  // Force re-render trigger
  @property({ type: Number, attribute: false })
  private renderTick = 0;

  // Bound handlers for cleanup
  private boundMouseMove = this.handleMouseMove.bind(this);
  private boundMouseUp = this.handleMouseUp.bind(this);

  // ResizeObserver
  private resizeObserver: ResizeObserver | null = null;
  private containerWidth = 600;
  private containerHeight = 400;

  @dispatch('@snice/node-click', { bubbles: true, composed: true })
  private emitNodeClick(node: NetworkNode) {
    return { node };
  }

  @dispatch('@snice/edge-click', { bubbles: true, composed: true })
  private emitEdgeClick(edge: NetworkEdge) {
    return { edge };
  }

  @dispatch('@snice/node-drag', { bubbles: true, composed: true })
  private emitNodeDrag(node: NetworkNode, x: number, y: number) {
    return { node, x, y };
  }

  @dispatch('@snice/graph-zoom', { bubbles: true, composed: true })
  private emitGraphZoom(scale: number, x: number, y: number) {
    return { scale, x, y };
  }

  @ready()
  init() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.containerWidth = entry.contentRect.width || 600;
        this.containerHeight = entry.contentRect.height || 400;
      }
    });
    this.resizeObserver.observe(this);

    // Build simulation if data was set before ready
    if (this.data.nodes.length > 0 && !this.simInitialized) {
      this.buildSimulation();
    }
  }

  @watch('data')
  onDataChange() {
    this.buildSimulation();
  }

  @watch('layout')
  onLayoutChange() {
    this.buildSimulation();
  }

  @dispose()
  cleanup() {
    this.stopSimulation();
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private getGroupColor(group?: string): string {
    if (!group) return DEFAULT_COLORS[0];
    const groups = [...new Set(this.data.nodes.map(n => n.group).filter(Boolean))];
    const idx = groups.indexOf(group);
    return DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
  }

  private getNodeRadius(node: SimNode): number {
    if (node.size) return node.size;
    return Math.max(6, Math.min(20, 4 + node.degree * 2));
  }

  private buildSimulation() {
    this.simInitialized = true;
    this.stopSimulation();

    const nodeMap = new Map<string, SimNode>();
    const degreeMap = new Map<string, number>();

    // Count degrees
    for (const edge of this.data.edges) {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    }

    const w = this.containerWidth || 600;
    const h = this.containerHeight || 400;

    // Create sim nodes
    this.data.nodes.forEach((node, i) => {
      const simNode: SimNode = {
        ...node,
        x: node.x ?? 0,
        y: node.y ?? 0,
        vx: 0,
        vy: 0,
        fx: (node.x !== undefined) ? node.x : null,
        fy: (node.y !== undefined) ? node.y : null,
        degree: degreeMap.get(node.id) || 0,
      };

      // Place initial positions based on layout
      if (node.x === undefined || node.y === undefined) {
        if (this.layout === 'circular') {
          const angle = (2 * Math.PI * i) / this.data.nodes.length;
          const radius = Math.min(w, h) * 0.35;
          simNode.x = w / 2 + radius * Math.cos(angle);
          simNode.y = h / 2 + radius * Math.sin(angle);
          simNode.fx = simNode.x;
          simNode.fy = simNode.y;
        } else if (this.layout === 'grid') {
          const cols = Math.ceil(Math.sqrt(this.data.nodes.length));
          const cellW = w / (cols + 1);
          const cellH = h / (Math.ceil(this.data.nodes.length / cols) + 1);
          simNode.x = (i % cols + 1) * cellW;
          simNode.y = (Math.floor(i / cols) + 1) * cellH;
          simNode.fx = simNode.x;
          simNode.fy = simNode.y;
        } else {
          // Force layout: random initial positions centered
          simNode.x = w / 2 + (Math.random() - 0.5) * w * 0.5;
          simNode.y = h / 2 + (Math.random() - 0.5) * h * 0.5;
          simNode.fx = null;
          simNode.fy = null;
        }
      }

      nodeMap.set(node.id, simNode);
    });

    this.simNodes = [...nodeMap.values()];

    // Create sim edges
    this.simEdges = [];
    for (const edge of this.data.edges) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (s && t) {
        this.simEdges.push({ source: s, target: t, edge });
      }
    }

    // Reset zoom/pan
    this.zoomScale = 1;
    this.panX = 0;
    this.panY = 0;

    if (this.layout === 'force' && this.animation) {
      this.simAlpha = 1;
      this.simRunning = true;
      this.tickSimulation();
    }
  }

  private tickSimulation() {
    if (!this.simRunning) return;

    const alpha = this.simAlpha;
    if (alpha < 0.001) {
      this.simRunning = false;
      return;
    }

    const w = this.containerWidth || 600;
    const h = this.containerHeight || 400;
    const cx = w / 2;
    const cy = h / 2;

    // Apply forces
    for (const node of this.simNodes) {
      if (node.fx !== null) continue;

      // Repulsion between all nodes
      for (const other of this.simNodes) {
        if (node === other) continue;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (this.chargeStrength * alpha) / (dist * dist);
        node.vx -= (dx / dist) * force;
        node.vy -= (dy / dist) * force;
      }

      // Centering force
      node.vx += (cx - node.x) * 0.01 * alpha;
      node.vy += (cy - node.y) * 0.01 * alpha;
    }

    // Spring forces along edges
    for (const se of this.simEdges) {
      const dx = se.target.x - se.source.x;
      const dy = se.target.y - se.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - this.linkDistance) * 0.05 * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (se.source.fx === null) {
        se.source.vx += fx;
        se.source.vy += fy;
      }
      if (se.target.fx === null) {
        se.target.vx -= fx;
        se.target.vy -= fy;
      }
    }

    // Update positions with velocity damping
    for (const node of this.simNodes) {
      if (node.fx !== null) {
        node.x = node.fx;
        node.y = node.fy!;
        node.vx = 0;
        node.vy = 0;
        continue;
      }
      node.vx *= 0.6;
      node.vy *= 0.6;
      node.x += node.vx;
      node.y += node.vy;
    }

    this.simAlpha *= 0.99;
    this.renderTick++;

    this.animFrameId = requestAnimationFrame(() => this.tickSimulation());
  }

  private stopSimulation() {
    this.simRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  private screenToGraph(screenX: number, screenY: number): { x: number; y: number } {
    const svg = this.svgElement;
    if (!svg) return { x: screenX, y: screenY };
    const rect = svg.getBoundingClientRect();
    return {
      x: (screenX - rect.left - this.panX) / this.zoomScale,
      y: (screenY - rect.top - this.panY) / this.zoomScale,
    };
  }

  private handleNodeMouseDown(e: MouseEvent, node: SimNode) {
    if (!this.dragEnabled) return;
    e.preventDefault();
    e.stopPropagation();

    this.dragNode = node;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.dragNode) {
      const pos = this.screenToGraph(e.clientX, e.clientY);
      this.dragNode.x = pos.x;
      this.dragNode.y = pos.y;
      this.dragNode.fx = pos.x;
      this.dragNode.fy = pos.y;

      // Reheat simulation
      if (this.layout === 'force' && this.animation) {
        this.simAlpha = Math.max(this.simAlpha, 0.3);
        if (!this.simRunning) {
          this.simRunning = true;
          this.tickSimulation();
        }
      }

      this.renderTick++;
      this.emitNodeDrag(this.dragNode, pos.x, pos.y);
    } else if (this.isPanning) {
      const dx = e.clientX - this.panStartX;
      const dy = e.clientY - this.panStartY;
      this.panX = this.panStartPanX + dx;
      this.panY = this.panStartPanY + dy;
      this.renderTick++;
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (this.dragNode) {
      const dx = Math.abs(e.clientX - this.dragStartX);
      const dy = Math.abs(e.clientY - this.dragStartY);
      if (dx < 3 && dy < 3) {
        this.emitNodeClick(this.dragNode);
      }
      this.dragNode = null;
    }
    this.isPanning = false;
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }

  private handleSvgMouseDown(e: MouseEvent) {
    if (!this.zoomEnabled) return;
    if ((e.target as Element).closest('.network-graph__node')) return;

    e.preventDefault();
    this.isPanning = true;
    this.panStartX = e.clientX;
    this.panStartY = e.clientY;
    this.panStartPanX = this.panX;
    this.panStartPanY = this.panY;

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  private handleWheel(e: WheelEvent) {
    if (!this.zoomEnabled) return;
    e.preventDefault();

    const svg = this.svgElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, this.zoomScale * delta));

    // Zoom around mouse position
    this.panX = mouseX - (mouseX - this.panX) * (newScale / this.zoomScale);
    this.panY = mouseY - (mouseY - this.panY) * (newScale / this.zoomScale);
    this.zoomScale = newScale;

    this.renderTick++;
    this.emitGraphZoom(this.zoomScale, this.panX, this.panY);
  }

  private handleNodeDblClick(e: MouseEvent, node: SimNode) {
    e.preventDefault();
    e.stopPropagation();
    // Unpin node
    node.fx = null;
    node.fy = null;
    if (this.layout === 'force' && this.animation) {
      this.simAlpha = Math.max(this.simAlpha, 0.3);
      if (!this.simRunning) {
        this.simRunning = true;
        this.tickSimulation();
      }
    }
  }

  private handleNodeEnter(node: SimNode, e: MouseEvent) {
    this.hoveredNodeId = node.id;
    const label = node.label || node.id;
    const degree = node.degree;
    this.tooltipText = `${label} (${degree} connection${degree !== 1 ? 's' : ''})`;
    this.updateTooltipPosition(e);
    this.tooltipVisible = true;
  }

  private handleNodeLeave() {
    this.hoveredNodeId = '';
    this.tooltipVisible = false;
  }

  private handleEdgeClick(e: MouseEvent, edge: NetworkEdge) {
    e.stopPropagation();
    this.emitEdgeClick(edge);
  }

  private updateTooltipPosition(e: MouseEvent) {
    const svg = this.svgElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    this.tooltipX = e.clientX - rect.left;
    this.tooltipY = e.clientY - rect.top;
  }

  private isNodeConnected(nodeId: string): boolean {
    if (!this.hoveredNodeId) return true;
    if (nodeId === this.hoveredNodeId) return true;
    return this.simEdges.some(se =>
      (se.source.id === this.hoveredNodeId && se.target.id === nodeId) ||
      (se.target.id === this.hoveredNodeId && se.source.id === nodeId)
    );
  }

  private isEdgeConnected(se: SimEdge): boolean {
    if (!this.hoveredNodeId) return true;
    return se.source.id === this.hoveredNodeId || se.target.id === this.hoveredNodeId;
  }

  private hasMultiEdge(source: string, target: string): boolean {
    let count = 0;
    for (const se of this.simEdges) {
      if ((se.source.id === source && se.target.id === target) ||
          (se.source.id === target && se.target.id === source)) {
        count++;
        if (count > 1) return true;
      }
    }
    return false;
  }

  private getEdgeCurveIndex(source: string, target: string, edge: NetworkEdge): number {
    let idx = 0;
    for (const se of this.simEdges) {
      if ((se.source.id === source && se.target.id === target) ||
          (se.source.id === target && se.target.id === source)) {
        if (se.edge === edge) return idx;
        idx++;
      }
    }
    return 0;
  }

  private renderEdgePath(se: SimEdge): string {
    const isMulti = this.hasMultiEdge(se.source.id, se.target.id);
    if (!isMulti) {
      return `M ${se.source.x} ${se.source.y} L ${se.target.x} ${se.target.y}`;
    }

    const idx = this.getEdgeCurveIndex(se.source.id, se.target.id, se.edge);
    const dx = se.target.x - se.source.x;
    const dy = se.target.y - se.source.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    const offset = (idx - 0.5) * 30;
    const mx = (se.source.x + se.target.x) / 2 + nx * offset;
    const my = (se.source.y + se.target.y) / 2 + ny * offset;
    return `M ${se.source.x} ${se.source.y} Q ${mx} ${my} ${se.target.x} ${se.target.y}`;
  }

  @render()
  renderContent() {
    const w = this.containerWidth || 600;
    const h = this.containerHeight || 400;
    const transform = `translate(${this.panX}, ${this.panY}) scale(${this.zoomScale})`;
    const hasHover = this.hoveredNodeId !== '';

    return html/*html*/`
      <div class="network-graph" role="img" aria-label="Network graph visualization">
        <svg class="network-graph__svg"
             viewBox="0 0 ${w} ${h}"
             @mousedown=${(e: MouseEvent) => this.handleSvgMouseDown(e)}
             @wheel=${(e: WheelEvent) => this.handleWheel(e)}>
          <g transform="${transform}">
            ${this.simEdges.map(se => {
              const connected = this.isEdgeConnected(se);
              const edgeColor = se.edge.color || '';
              const weight = se.edge.weight || 1;
              const path = this.renderEdgePath(se);

              return html/*html*/`
                <path class="network-graph__edge ${hasHover && connected ? 'network-graph__edge--highlighted' : ''} ${hasHover && !connected ? 'network-graph__edge--dimmed' : ''}"
                      d="${path}"
                      stroke="${edgeColor}"
                      stroke-width="${Math.max(1, weight)}"
                      @click=${(e: MouseEvent) => this.handleEdgeClick(e, se.edge)} />
                <if ${this.showLabels && se.edge.label}>
                  <text class="network-graph__edge-label ${hasHover && !connected ? 'network-graph__edge-label--dimmed' : ''}"
                        x="${(se.source.x + se.target.x) / 2}"
                        y="${(se.source.y + se.target.y) / 2}">${se.edge.label}</text>
                </if>
              `;
            })}
            ${this.simNodes.map(node => {
              const connected = this.isNodeConnected(node.id);
              const r = this.getNodeRadius(node);
              const fill = node.color || this.getGroupColor(node.group);
              const isDragging = this.dragNode === node;

              return html/*html*/`
                <g class="network-graph__node ${!connected ? 'network-graph__node--dimmed' : ''} ${isDragging ? 'network-graph__node--dragging' : ''}"
                   @mousedown=${(e: MouseEvent) => this.handleNodeMouseDown(e, node)}
                   @dblclick=${(e: MouseEvent) => this.handleNodeDblClick(e, node)}
                   @mouseenter=${(e: MouseEvent) => this.handleNodeEnter(node, e)}
                   @mouseleave=${() => this.handleNodeLeave()}>
                  <circle class="network-graph__node-circle"
                          cx="${node.x}"
                          cy="${node.y}"
                          r="${r}"
                          fill="${fill}" />
                  <if ${this.showLabels && (node.label || node.id)}>
                    <text class="network-graph__node-label ${!connected ? 'network-graph__node-label--dimmed' : ''}"
                          x="${node.x}"
                          y="${node.y + r + 14}">${node.label || node.id}</text>
                  </if>
                </g>
              `;
            })}
          </g>
        </svg>
        <div class="network-graph__tooltip ${this.tooltipVisible ? 'network-graph__tooltip--visible' : ''}"
             style="left: ${this.tooltipX}px; top: ${this.tooltipY}px;">
          ${this.tooltipText}
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
