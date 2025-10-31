import type { TreeNode } from './snice-tree.types';

export interface SniceTreeItemElement extends HTMLElement {
  node: TreeNode;
  level: number;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
  loading: boolean;
  indeterminate: boolean;
  showCheckbox: boolean;
  showIcon: boolean;
  hasChildren: boolean;

  expand(): void;
  collapse(): void;
  toggle(): void;
  select(): void;
  deselect(): void;
  check(): void;
  uncheck(): void;
  finishLoading(): void;
}

export interface TreeItemToggleDetail {
  nodeId: string;
  expanded: boolean;
}

export interface TreeItemSelectDetail {
  nodeId: string;
  selected: boolean;
}

export interface TreeItemCheckDetail {
  nodeId: string;
  checked: boolean;
}
