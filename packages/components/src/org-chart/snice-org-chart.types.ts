export type OrgChartDirection = 'top-down' | 'left-right';

export interface OrgChartNode {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  children?: OrgChartNode[];
}

export interface SniceOrgChartElement extends HTMLElement {
  data: OrgChartNode | null;
  direction: OrgChartDirection;
  compact: boolean;

  collapseNode(id: string): void;
  expandNode(id: string): void;
  expandAll(): void;
  collapseAll(): void;
}

export interface SniceOrgChartEventMap {
  'node-click': CustomEvent<{ node: OrgChartNode }>;
  'node-expand': CustomEvent<{ node: OrgChartNode }>;
  'node-collapse': CustomEvent<{ node: OrgChartNode }>;
}
