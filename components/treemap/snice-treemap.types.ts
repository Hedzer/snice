export interface TreemapNode {
  label: string;
  value: number;
  children?: TreemapNode[];
  color?: string;
}

export type TreemapColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'warm' | 'cool' | 'rainbow';

export interface TreemapRect {
  x: number;
  y: number;
  width: number;
  height: number;
  node: TreemapNode;
  depth: number;
  colorIndex: number;
}

export interface SniceTreemapElement extends HTMLElement {
  data: TreemapNode;
  showLabels: boolean;
  showValues: boolean;
  colorScheme: TreemapColorScheme;
  padding: number;
  animation: boolean;
  drillPath: TreemapNode[];
  drillDown(node: TreemapNode): void;
  drillUp(): void;
  drillToRoot(): void;
}

export interface SniceTreemapEventMap {
  '@snice/treemap-click': CustomEvent<{ node: TreemapNode; depth: number }>;
  '@snice/treemap-hover': CustomEvent<{ node: TreemapNode; depth: number } | null>;
  '@snice/treemap-drill': CustomEvent<{ node: TreemapNode; path: TreemapNode[] }>;
}
