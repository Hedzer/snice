import { element, property, dispatch, query, render, styles, ready, dispose, watch, html, css } from 'snice';
import cssContent from './snice-flow.css?inline';
import type { FlowNode, FlowEdge, SniceFlowElement } from './snice-flow.types';

interface PortPosition {
  x: number;
  y: number;
}

const DEFAULT_NODE_WIDTH = 160;
const DEFAULT_NODE_HEIGHT = 80;

@element('snice-flow')
export class SniceFlow extends HTMLElement implements SniceFlowElement {
  @property({ type: Array, attribute: false })
  nodes: FlowNode[] = [];

  @property({ type: Array, attribute: false })
  edges: FlowEdge[] = [];

  @property({ type: Boolean, attribute: 'snap-to-grid' })
  snapToGrid = true;

  @property({ type: Number, attribute: 'grid-size' })
  gridSize = 20;

  @property({ type: Boolean, attribute: 'zoom-enabled' })
  zoomEnabled = true;

  @property({ type: Boolean, attribute: 'pan-enabled' })
  panEnabled = true;

  @property({ type: Boolean })
  minimap = true;

  @property({ type: Boolean })
  editable = true;

  @query('.flow')
  private containerEl?: HTMLElement;

  @query('.flow__svg')
  private svgEl?: SVGSVGElement;

  @query('.flow__nodes')
  private nodesContainerEl?: HTMLElement;

  @query('.flow__minimap-svg')
  private minimapSvgEl?: SVGSVGElement;

  // SVG groups (created manually for SVG namespace)
  private transformGroupEl?: SVGGElement;
  private edgesGroupEl?: SVGGElement;
  private previewGroupEl?: SVGGElement;
  private defsEl?: SVGDefsElement;

  // Transform state
  private zoomScale = 1;
  private panX = 0;
  private panY = 0;

  // Drag state
  private dragNode: FlowNode | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // Pan state
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private panStartPanX = 0;
  private panStartPanY = 0;

  // Edge drawing state
  private drawingEdge = false;
  private drawSourceNodeId = '';
  private drawSourcePortId = '';
  private drawSourceIsOutput = true;
  private drawEndX = 0;
  private drawEndY = 0;

  // Selection
  private selectedNodeId = '';
  private selectedEdgeId = '';

  // Sizing
  private containerWidth = 800;
  private containerHeight = 500;
  private resizeObserver: ResizeObserver | null = null;

  // Bound handlers
  private boundMouseMove = this.handleMouseMove.bind(this);
  private boundMouseUp = this.handleMouseUp.bind(this);

  @dispatch('node-drag', { bubbles: true, composed: true })
  private emitNodeDrag(node: FlowNode, x: number, y: number) {
    return { node, x, y };
  }

  @dispatch('node-select', { bubbles: true, composed: true })
  private emitNodeSelect(node: FlowNode | null) {
    return { node };
  }

  @dispatch('edge-connect', { bubbles: true, composed: true })
  private emitEdgeConnect(edge: FlowEdge) {
    return { edge };
  }

  @dispatch('edge-disconnect', { bubbles: true, composed: true })
  private emitEdgeDisconnect(edge: FlowEdge) {
    return { edge };
  }

  @dispatch('canvas-click', { bubbles: true, composed: true })
  private emitCanvasClick(x: number, y: number) {
    return { x, y };
  }

  private initialized = false;
  private listenersAttached = false;

  @ready()
  init() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.containerWidth = entry.contentRect.width || 800;
        this.containerHeight = entry.contentRect.height || 500;
        if (this.initialized) this.rebuild();
      }
    });
    this.resizeObserver.observe(this);
    this.ensureSvgSetup();
    this.attachListeners();
    this.initialized = true;
    this.rebuild();
  }

  @watch('nodes')
  onNodesChange() {
    if (this.initialized) this.rebuild();
  }

  @watch('edges')
  onEdgesChange() {
    if (this.initialized) this.rebuild();
  }

  @watch('minimap')
  onMinimapChange() {
    if (this.initialized) this.updateMinimap();
  }

  @dispose()
  cleanup() {
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  // --- Public API ---

  addNode(node: FlowNode) {
    this.nodes = [...this.nodes, node];
  }

  removeNode(id: string) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
    if (this.selectedNodeId === id) {
      this.selectedNodeId = '';
      this.emitNodeSelect(null);
    }
  }

  addEdge(edge: FlowEdge) {
    this.edges = [...this.edges, edge];
  }

  removeEdge(id: string) {
    const edge = this.edges.find(e => e.id === id);
    this.edges = this.edges.filter(e => e.id !== id);
    if (edge) this.emitEdgeDisconnect(edge);
  }

  fitView() {
    if (this.nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of this.nodes) {
      const w = node.width || DEFAULT_NODE_WIDTH;
      const h = node.height || DEFAULT_NODE_HEIGHT;
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + w);
      maxY = Math.max(maxY, node.y + h);
    }

    const padding = 40;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scaleX = this.containerWidth / contentW;
    const scaleY = this.containerHeight / contentH;
    this.zoomScale = Math.min(scaleX, scaleY, 1.5);
    this.panX = (this.containerWidth - contentW * this.zoomScale) / 2 - minX * this.zoomScale + padding * this.zoomScale;
    this.panY = (this.containerHeight - contentH * this.zoomScale) / 2 - minY * this.zoomScale + padding * this.zoomScale;

    this.rebuild();
  }

  // --- SVG Setup ---

  private ensureSvgSetup(): boolean {
    if (this.edgesGroupEl && this.transformGroupEl) return true;
    const svg = this.svgEl;
    if (!svg) return false;

    const ns = 'http://www.w3.org/2000/svg';

    // Defs for arrow marker
    this.defsEl = document.createElementNS(ns, 'defs') as SVGDefsElement;
    const marker = document.createElementNS(ns, 'marker');
    marker.setAttribute('id', 'flow-arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('orient', 'auto-start-reverse');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    path.setAttribute('class', 'flow__arrow');
    marker.appendChild(path);
    this.defsEl.appendChild(marker);
    svg.appendChild(this.defsEl);

    // Transform group
    this.transformGroupEl = document.createElementNS(ns, 'g') as SVGGElement;
    this.edgesGroupEl = document.createElementNS(ns, 'g') as SVGGElement;
    this.previewGroupEl = document.createElementNS(ns, 'g') as SVGGElement;
    this.transformGroupEl.appendChild(this.edgesGroupEl);
    this.transformGroupEl.appendChild(this.previewGroupEl);
    svg.appendChild(this.transformGroupEl);
    return true;
  }

  private attachListeners() {
    if (this.listenersAttached) return;
    const svg = this.svgEl;
    if (!svg) return;

    this.listenersAttached = true;

    svg.addEventListener('mousedown', (e: MouseEvent) => this.handleSvgMouseDown(e));
    svg.addEventListener('wheel', (e: WheelEvent) => this.handleWheel(e), { passive: false });
    svg.addEventListener('click', (e: MouseEvent) => {
      // Only fire canvas click if clicking on the SVG background
      if (e.target === svg || (e.target as Element).closest('.flow__svg') === svg && !(e.target as Element).closest('.flow__edge')) {
        const pos = this.screenToCanvas(e.clientX, e.clientY);
        this.selectedNodeId = '';
        this.selectedEdgeId = '';
        this.emitNodeSelect(null);
        this.emitCanvasClick(pos.x, pos.y);
        this.rebuild();
      }
    });

    // Edge click
    svg.addEventListener('click', (e: MouseEvent) => {
      const edgePath = (e.target as Element).closest('.flow__edge');
      if (edgePath) {
        e.stopPropagation();
        const edgeId = edgePath.getAttribute('data-edge-id');
        if (edgeId) {
          this.selectedEdgeId = edgeId;
          this.selectedNodeId = '';
          this.rebuild();
        }
      }
    });
  }

  // --- Coordinate transforms ---

  private screenToCanvas(sx: number, sy: number): { x: number; y: number } {
    const svg = this.svgEl;
    if (!svg) return { x: sx, y: sy };
    const rect = svg.getBoundingClientRect();
    return {
      x: (sx - rect.left - this.panX) / this.zoomScale,
      y: (sy - rect.top - this.panY) / this.zoomScale,
    };
  }

  private snap(v: number): number {
    if (!this.snapToGrid) return v;
    return Math.round(v / this.gridSize) * this.gridSize;
  }

  // --- Port positions ---

  private getPortPosition(nodeId: string, portId: string, isOutput: boolean): PortPosition {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const w = node.width || DEFAULT_NODE_WIDTH;
    const h = node.height || DEFAULT_NODE_HEIGHT;
    const ports = isOutput ? (node.outputs || []) : (node.inputs || []);
    const idx = ports.findIndex(p => p.id === portId);
    if (idx === -1) return { x: node.x, y: node.y };

    const headerHeight = 28;
    const portAreaHeight = h - headerHeight;
    const portSpacing = ports.length > 1 ? portAreaHeight / (ports.length + 1) : portAreaHeight / 2;
    const yOffset = headerHeight + portSpacing * (idx + 1);

    return {
      x: isOutput ? node.x + w : node.x,
      y: node.y + yOffset,
    };
  }

  private findNearestPort(x: number, y: number, needOutput: boolean): { nodeId: string; portId: string } | null {
    let best: { nodeId: string; portId: string } | null = null;
    let bestDist = 20; // max distance threshold

    for (const node of this.nodes) {
      const ports = needOutput ? (node.outputs || []) : (node.inputs || []);
      for (const port of ports) {
        const pos = this.getPortPosition(node.id, port.id, needOutput);
        const dx = pos.x - x;
        const dy = pos.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = { nodeId: node.id, portId: port.id };
        }
      }
    }
    return best;
  }

  // --- Mouse handling ---

  private handleSvgMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;

    // Background pan
    if (this.panEnabled) {
      e.preventDefault();
      this.isPanning = true;
      this.panStartX = e.clientX;
      this.panStartY = e.clientY;
      this.panStartPanX = this.panX;
      this.panStartPanY = this.panY;
      document.addEventListener('mousemove', this.boundMouseMove);
      document.addEventListener('mouseup', this.boundMouseUp);
    }
  }

  handleNodeMouseDown(e: MouseEvent, nodeId: string) {
    e.preventDefault();
    e.stopPropagation();

    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Select node
    this.selectedNodeId = nodeId;
    this.selectedEdgeId = '';
    this.emitNodeSelect(node);

    // Start drag
    this.dragNode = node;
    const pos = this.screenToCanvas(e.clientX, e.clientY);
    this.dragOffsetX = pos.x - node.x;
    this.dragOffsetY = pos.y - node.y;

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
    this.rebuild();
  }

  handlePortMouseDown(e: MouseEvent, nodeId: string, portId: string, isOutput: boolean) {
    if (!this.editable) return;
    e.preventDefault();
    e.stopPropagation();

    this.drawingEdge = true;
    this.drawSourceNodeId = nodeId;
    this.drawSourcePortId = portId;
    this.drawSourceIsOutput = isOutput;

    const pos = this.screenToCanvas(e.clientX, e.clientY);
    this.drawEndX = pos.x;
    this.drawEndY = pos.y;

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.dragNode) {
      const pos = this.screenToCanvas(e.clientX, e.clientY);
      const newX = this.snap(pos.x - this.dragOffsetX);
      const newY = this.snap(pos.y - this.dragOffsetY);
      this.dragNode.x = newX;
      this.dragNode.y = newY;
      this.emitNodeDrag(this.dragNode, newX, newY);
      this.rebuild();
    } else if (this.drawingEdge) {
      const pos = this.screenToCanvas(e.clientX, e.clientY);
      this.drawEndX = pos.x;
      this.drawEndY = pos.y;
      this.updateEdgePreview();
    } else if (this.isPanning) {
      const dx = e.clientX - this.panStartX;
      const dy = e.clientY - this.panStartY;
      this.panX = this.panStartPanX + dx;
      this.panY = this.panStartPanY + dy;
      this.rebuild();
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (this.drawingEdge) {
      this.finishEdgeDraw(e);
    }
    this.dragNode = null;
    this.isPanning = false;
    this.drawingEdge = false;
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    this.clearEdgePreview();
    this.rebuild();
  }

  private finishEdgeDraw(e: MouseEvent) {
    const pos = this.screenToCanvas(e.clientX, e.clientY);
    // If started from output, find nearest input; vice versa
    const needOutput = !this.drawSourceIsOutput;
    const target = this.findNearestPort(pos.x, pos.y, needOutput);

    if (target && target.nodeId !== this.drawSourceNodeId) {
      const sourceNodeId = this.drawSourceIsOutput ? this.drawSourceNodeId : target.nodeId;
      const sourcePortId = this.drawSourceIsOutput ? this.drawSourcePortId : target.portId;
      const targetNodeId = this.drawSourceIsOutput ? target.nodeId : this.drawSourceNodeId;
      const targetPortId = this.drawSourceIsOutput ? target.portId : this.drawSourcePortId;

      // Check for duplicate
      const exists = this.edges.some(e =>
        e.source === sourceNodeId && e.target === targetNodeId &&
        e.sourcePort === sourcePortId && e.targetPort === targetPortId
      );

      if (!exists) {
        const newEdge: FlowEdge = {
          id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source: sourceNodeId,
          target: targetNodeId,
          sourcePort: sourcePortId,
          targetPort: targetPortId,
        };
        this.edges = [...this.edges, newEdge];
        this.emitEdgeConnect(newEdge);
      }
    }
  }

  private handleWheel(e: WheelEvent) {
    if (!this.zoomEnabled) return;
    e.preventDefault();

    const svg = this.svgEl;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(4, this.zoomScale * delta));

    this.panX = mouseX - (mouseX - this.panX) * (newScale / this.zoomScale);
    this.panY = mouseY - (mouseY - this.panY) * (newScale / this.zoomScale);
    this.zoomScale = newScale;

    this.rebuild();
  }

  // --- Bezier curves ---

  private bezierPath(x1: number, y1: number, x2: number, y2: number): string {
    const dx = Math.abs(x2 - x1) * 0.5;
    const cp1x = x1 + dx;
    const cp1y = y1;
    const cp2x = x2 - dx;
    const cp2y = y2;
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }

  // --- Edge preview ---

  private updateEdgePreview() {
    if (!this.previewGroupEl) return;
    const sourcePos = this.getPortPosition(this.drawSourceNodeId, this.drawSourcePortId, this.drawSourceIsOutput);

    let x1: number, y1: number, x2: number, y2: number;
    if (this.drawSourceIsOutput) {
      x1 = sourcePos.x;
      y1 = sourcePos.y;
      x2 = this.drawEndX;
      y2 = this.drawEndY;
    } else {
      x1 = this.drawEndX;
      y1 = this.drawEndY;
      x2 = sourcePos.x;
      y2 = sourcePos.y;
    }

    const d = this.bezierPath(x1, y1, x2, y2);
    this.previewGroupEl.innerHTML = `<path class="flow__edge-preview" d="${d}" />`;
  }

  private clearEdgePreview() {
    if (this.previewGroupEl) {
      this.previewGroupEl.innerHTML = '';
    }
  }

  // --- Grid pattern ---

  private gridPatternSvg(): string {
    const g = this.gridSize;
    return `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="flow-grid-small" width="${g}" height="${g}" patternUnits="userSpaceOnUse" patternTransform="translate(${this.panX % (g * this.zoomScale)}, ${this.panY % (g * this.zoomScale)}) scale(${this.zoomScale})"><circle cx="${g / 2}" cy="${g / 2}" r="0.5" fill="var(--snice-color-text-tertiary, rgb(115 115 115))" opacity="0.3"/></pattern></defs><rect width="100%" height="100%" fill="url(#flow-grid-small)"/></svg>`;
  }

  // --- Rebuild ---

  private rebuild() {
    this.ensureSvgSetup();
    this.attachListeners();
    this.rebuildTransform();
    this.rebuildEdges();
    this.rebuildNodes();
    this.updateGrid();
    this.updateMinimap();
  }

  private rebuildTransform() {
    if (this.transformGroupEl) {
      this.transformGroupEl.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoomScale})`);
    }
  }

  private rebuildEdges() {
    if (!this.edgesGroupEl) return;

    let parts = '';
    for (const edge of this.edges) {
      const sourcePort = edge.sourcePort || (this.nodes.find(n => n.id === edge.source)?.outputs?.[0]?.id || '');
      const targetPort = edge.targetPort || (this.nodes.find(n => n.id === edge.target)?.inputs?.[0]?.id || '');

      const p1 = this.getPortPosition(edge.source, sourcePort, true);
      const p2 = this.getPortPosition(edge.target, targetPort, false);
      const d = this.bezierPath(p1.x, p1.y, p2.x, p2.y);

      const cls = ['flow__edge'];
      if (edge.id === this.selectedEdgeId) cls.push('flow__edge--selected');
      if (edge.animated) cls.push('flow__edge--animated');

      const colorAttr = edge.color ? ` stroke="${edge.color}"` : '';
      parts += `<path class="${cls.join(' ')}" d="${d}" data-edge-id="${edge.id}" marker-end="url(#flow-arrow)"${colorAttr} />`;

      if (edge.label) {
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        parts += `<text class="flow__edge-label" x="${mx}" y="${my - 8}">${edge.label}</text>`;
      }
    }

    this.edgesGroupEl.innerHTML = parts;
  }

  private rebuildNodes() {
    const container = this.nodesContainerEl;
    if (!container) return;

    let nodesHtml = '';
    for (const node of this.nodes) {
      const w = node.width || DEFAULT_NODE_WIDTH;
      const h = node.height || DEFAULT_NODE_HEIGHT;
      const x = node.x * this.zoomScale + this.panX;
      const y = node.y * this.zoomScale + this.panY;
      const scaledW = w * this.zoomScale;
      const scaledH = h * this.zoomScale;

      const cls = ['flow__node'];
      if (node.id === this.selectedNodeId) cls.push('flow__node--selected');
      if (this.dragNode && this.dragNode.id === node.id) cls.push('flow__node--dragging');

      const headerBg = node.color ? `background:${node.color};color:white;` : '';

      nodesHtml += `<div class="${cls.join(' ')}" data-node-id="${node.id}" style="left:${x}px;top:${y}px;width:${scaledW}px;transform-origin:top left;transform:scale(1);">`;
      nodesHtml += `<div class="flow__node-header" style="${headerBg}">`;
      if (node.type) nodesHtml += `<span class="flow__node-type">${node.type}</span>`;
      nodesHtml += `<span>${node.label || node.id}</span>`;
      nodesHtml += `</div>`;
      nodesHtml += `<div class="flow__node-body">`;

      // Inputs
      const inputs = node.inputs || [];
      if (inputs.length > 0) {
        nodesHtml += `<div class="flow__node-inputs">`;
        for (const port of inputs) {
          const connected = this.isPortConnected(node.id, port.id, false);
          const pcls = ['flow__port', connected ? 'flow__port--connected' : ''].filter(Boolean).join(' ');
          nodesHtml += `<div class="${pcls}" data-port-id="${port.id}" data-port-type="input" data-node-id="${node.id}">`;
          nodesHtml += `<span class="flow__port-dot"></span>`;
          if (port.label) nodesHtml += `<span>${port.label}</span>`;
          nodesHtml += `</div>`;
        }
        nodesHtml += `</div>`;
      }

      // Outputs
      const outputs = node.outputs || [];
      if (outputs.length > 0) {
        nodesHtml += `<div class="flow__node-outputs">`;
        for (const port of outputs) {
          const connected = this.isPortConnected(node.id, port.id, true);
          const pcls = ['flow__port', 'flow__port--output', connected ? 'flow__port--connected' : ''].filter(Boolean).join(' ');
          nodesHtml += `<div class="${pcls}" data-port-id="${port.id}" data-port-type="output" data-node-id="${node.id}">`;
          if (port.label) nodesHtml += `<span>${port.label}</span>`;
          nodesHtml += `<span class="flow__port-dot"></span>`;
          nodesHtml += `</div>`;
        }
        nodesHtml += `</div>`;
      }

      nodesHtml += `</div></div>`;
    }

    container.innerHTML = nodesHtml;

    // Attach event listeners to nodes and ports
    const nodeEls = container.querySelectorAll('.flow__node');
    nodeEls.forEach(el => {
      const nodeId = el.getAttribute('data-node-id')!;
      el.addEventListener('mousedown', (e: Event) => this.handleNodeMouseDown(e as MouseEvent, nodeId));
    });

    const portEls = container.querySelectorAll('.flow__port');
    portEls.forEach(el => {
      const portId = el.getAttribute('data-port-id')!;
      const nodeId = el.getAttribute('data-node-id')!;
      const isOutput = el.getAttribute('data-port-type') === 'output';
      el.addEventListener('mousedown', (e: Event) => this.handlePortMouseDown(e as MouseEvent, nodeId, portId, isOutput));
    });
  }

  private isPortConnected(nodeId: string, portId: string, isOutput: boolean): boolean {
    return this.edges.some(e => {
      if (isOutput) {
        return e.source === nodeId && (e.sourcePort === portId || (!e.sourcePort && portId === this.nodes.find(n => n.id === nodeId)?.outputs?.[0]?.id));
      }
      return e.target === nodeId && (e.targetPort === portId || (!e.targetPort && portId === this.nodes.find(n => n.id === nodeId)?.inputs?.[0]?.id));
    });
  }

  private updateGrid() {
    const gridEl = this.containerEl?.querySelector('.flow__grid') as HTMLElement | null;
    if (!gridEl) return;
    if (this.snapToGrid) {
      gridEl.innerHTML = this.gridPatternSvg();
      gridEl.style.display = '';
    } else {
      gridEl.style.display = 'none';
    }
  }

  private updateMinimap() {
    const svg = this.minimapSvgEl;
    if (!svg || !this.minimap) return;

    if (this.nodes.length === 0) {
      svg.innerHTML = '';
      return;
    }

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of this.nodes) {
      const w = node.width || DEFAULT_NODE_WIDTH;
      const h = node.height || DEFAULT_NODE_HEIGHT;
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + w);
      maxY = Math.max(maxY, node.y + h);
    }

    const pad = 40;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;

    const vb = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
    svg.setAttribute('viewBox', vb);

    let parts = '';

    // Edges
    for (const edge of this.edges) {
      const sourcePort = edge.sourcePort || (this.nodes.find(n => n.id === edge.source)?.outputs?.[0]?.id || '');
      const targetPort = edge.targetPort || (this.nodes.find(n => n.id === edge.target)?.inputs?.[0]?.id || '');
      const p1 = this.getPortPosition(edge.source, sourcePort, true);
      const p2 = this.getPortPosition(edge.target, targetPort, false);
      parts += `<line class="flow__minimap-edge" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" />`;
    }

    // Nodes
    for (const node of this.nodes) {
      const w = node.width || DEFAULT_NODE_WIDTH;
      const h = node.height || DEFAULT_NODE_HEIGHT;
      parts += `<rect class="flow__minimap-node" x="${node.x}" y="${node.y}" width="${w}" height="${h}" rx="2" />`;
    }

    // Viewport indicator
    const vpX = -this.panX / this.zoomScale;
    const vpY = -this.panY / this.zoomScale;
    const vpW = this.containerWidth / this.zoomScale;
    const vpH = this.containerHeight / this.zoomScale;
    parts += `<rect class="flow__minimap-viewport" x="${vpX}" y="${vpY}" width="${vpW}" height="${vpH}" />`;

    svg.innerHTML = parts;
  }

  @render({ once: true })
  renderContent() {
    return html/*html*/`
      <div class="flow" part="base">
        <div class="flow__grid"></div>
        <svg class="flow__svg" part="canvas"></svg>
        <div class="flow__nodes" part="nodes"></div>
        <div class="flow__minimap" part="minimap" style="${this.minimap ? '' : 'display:none'}">
          <svg class="flow__minimap-svg"></svg>
        </div>
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
    'snice-flow': SniceFlow;
  }
}
