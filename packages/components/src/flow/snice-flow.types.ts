export interface FlowNode {
  id: string;
  x: number;
  y: number;
  type?: string;
  data?: Record<string, unknown>;
  label?: string;
  width?: number;
  height?: number;
  inputs?: FlowPort[];
  outputs?: FlowPort[];
  color?: string;
  selected?: boolean;
}

export interface FlowPort {
  id: string;
  label?: string;
  type?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  label?: string;
  color?: string;
  animated?: boolean;
}

export interface SniceFlowElement extends HTMLElement {
  nodes: FlowNode[];
  edges: FlowEdge[];
  snapToGrid: boolean;
  gridSize: number;
  zoomEnabled: boolean;
  panEnabled: boolean;
  minimap: boolean;
  editable: boolean;
  addNode(node: FlowNode): void;
  removeNode(id: string): void;
  addEdge(edge: FlowEdge): void;
  removeEdge(id: string): void;
  fitView(): void;
}

export interface SniceFlowEventMap {
  'node-drag': CustomEvent<{ node: FlowNode; x: number; y: number }>;
  'node-select': CustomEvent<{ node: FlowNode | null }>;
  'edge-connect': CustomEvent<{ edge: FlowEdge }>;
  'edge-disconnect': CustomEvent<{ edge: FlowEdge }>;
  'canvas-click': CustomEvent<{ x: number; y: number }>;
}
