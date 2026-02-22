export interface NetworkNode {
  id: string;
  label?: string;
  group?: string;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  label?: string;
  weight?: number;
  color?: string;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export type LayoutType = 'force' | 'circular' | 'grid';

export interface SniceNetworkGraphElement extends HTMLElement {
  data: NetworkGraphData;
  layout: LayoutType;
  chargeStrength: number;
  linkDistance: number;
  zoomEnabled: boolean;
  dragEnabled: boolean;
  showLabels: boolean;
  animation: boolean;
}

export interface SniceNetworkGraphEventMap {
  '@snice/node-click': CustomEvent<{ node: NetworkNode }>;
  '@snice/edge-click': CustomEvent<{ edge: NetworkEdge }>;
  '@snice/node-drag': CustomEvent<{ node: NetworkNode; x: number; y: number }>;
  '@snice/graph-zoom': CustomEvent<{ scale: number; x: number; y: number }>;
}
