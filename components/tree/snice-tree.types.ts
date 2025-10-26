export type TreeSelectionMode = 'single' | 'multiple' | 'none';

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  iconImage?: string;
  children?: TreeNode[];
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean;
  expanded?: boolean;
  lazy?: boolean;
  data?: any;
}

export interface SniceTreeElement extends HTMLElement {
  selectionMode: TreeSelectionMode;
  showCheckboxes: boolean;
  showIcons: boolean;
  expandOnClick: boolean;
  nodes: TreeNode[];
  selectedNodes: string[];
  checkedNodes: string[];

  expandNode(id: string): void;
  collapseNode(id: string): void;
  toggleNode(id: string): void;
  expandAll(): void;
  collapseAll(): void;
  selectNode(id: string): void;
  deselectNode(id: string): void;
  toggleSelection(id: string): void;
  checkNode(id: string): void;
  uncheckNode(id: string): void;
  toggleCheck(id: string): void;
  getNode(id: string): TreeNode | undefined;
  getSelectedNodes(): TreeNode[];
  getCheckedNodes(): TreeNode[];
}

export interface TreeNodeExpandDetail {
  nodeId: string;
  node: TreeNode;
  tree: SniceTreeElement;
}

export interface TreeNodeCollapseDetail {
  nodeId: string;
  node: TreeNode;
  tree: SniceTreeElement;
}

export interface TreeNodeSelectDetail {
  nodeId: string;
  node: TreeNode;
  selectedNodes: TreeNode[];
  tree: SniceTreeElement;
}

export interface TreeNodeCheckDetail {
  nodeId: string;
  node: TreeNode;
  checked: boolean;
  checkedNodes: TreeNode[];
  tree: SniceTreeElement;
}

export interface TreeNodeLazyLoadDetail {
  nodeId: string;
  node: TreeNode;
  tree: SniceTreeElement;
}
