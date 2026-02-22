export interface SankeyNode {
  id: string;
  label?: string;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export type SankeyAlignment = 'left' | 'right' | 'center' | 'justify';

export interface SankeyLayoutNode {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  depth: number;
  sourceLinks: SankeyLayoutLink[];
  targetLinks: SankeyLayoutLink[];
}

export interface SankeyLayoutLink {
  source: SankeyLayoutNode;
  target: SankeyLayoutNode;
  value: number;
  color: string;
  width: number;
  sy: number;
  ty: number;
}

export interface SniceSankeyElement extends HTMLElement {
  data: SankeyData;
  nodeWidth: number;
  nodePadding: number;
  alignment: SankeyAlignment;
  showLabels: boolean;
  showValues: boolean;
  animation: boolean;
}

export interface SniceSankeyEventMap {
  'sankey-node-click': CustomEvent<{ node: SankeyNode }>;
  'sankey-link-click': CustomEvent<{ link: SankeyLink }>;
  'sankey-hover': CustomEvent<{ type: 'node' | 'link'; item: SankeyNode | SankeyLink } | null>;
}
