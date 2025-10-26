import { element, property, watch, ready, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-tree.css?inline';
import type {
  TreeNode,
  TreeSelectionMode,
  SniceTreeElement,
  TreeNodeExpandDetail,
  TreeNodeCollapseDetail,
  TreeNodeSelectDetail,
  TreeNodeCheckDetail,
  TreeNodeLazyLoadDetail
} from './snice-tree.types';
import './snice-tree-item';

@element('snice-tree')
export class SniceTree extends HTMLElement implements SniceTreeElement {
  @property({  })
  selectionMode: TreeSelectionMode = 'single';

  @property({ type: Boolean, attribute: 'show-checkboxes' })
  showCheckboxes = false;

  @property({ type: Boolean, attribute: 'show-icons' })
  showIcons = true;

  @property({ type: Boolean, attribute: 'expand-on-click' })
  expandOnClick = false;

  @property({ type: Array })
  nodes: TreeNode[] = [];

  @property({ type: Array, attribute: 'selected-nodes' })
  selectedNodes: string[] = [];

  @property({ type: Array, attribute: 'checked-nodes' })
  checkedNodes: string[] = [];

  private nodeMap = new Map<string, TreeNode>();

  @ready()
  init() {
    this.buildNodeMap();
    this.syncNodeStates();

    // Listen for tree item events
    this.addEventListener('tree-item-toggle', this.handleItemToggle.bind(this));
    this.addEventListener('tree-item-select', this.handleItemSelect.bind(this));
    this.addEventListener('tree-item-check', this.handleItemCheck.bind(this));
    this.addEventListener('tree-item-lazy-load', this.handleLazyLoad.bind(this));
  }

  @watch('nodes')
  handleNodesChange() {
    this.buildNodeMap();
    this.syncNodeStates();
  }

  @watch('selectedNodes')
  handleSelectedNodesChange() {
    this.syncNodeStates();
  }

  @watch('checkedNodes')
  handleCheckedNodesChange() {
    this.syncNodeStates();
  }

  private buildNodeMap() {
    this.nodeMap.clear();

    const addToMap = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        this.nodeMap.set(node.id, node);
        if (node.children) {
          addToMap(node.children);
        }
      }
    };

    addToMap(this.nodes);
  }

  private syncNodeStates() {
    // Update selected state
    for (const [id, node] of this.nodeMap.entries()) {
      node.selected = this.selectedNodes.includes(id);
      node.checked = this.checkedNodes.includes(id);
    }
  }

  private handleItemToggle(e: Event) {
    const event = e as CustomEvent;
    const { nodeId, expanded } = event.detail;
    const node = this.nodeMap.get(nodeId);

    if (!node) return;

    node.expanded = expanded;

    if (expanded) {
      this.dispatchExpandEvent(nodeId, node);
    } else {
      this.dispatchCollapseEvent(nodeId, node);
    }
  }

  private handleItemSelect(e: Event) {
    const event = e as CustomEvent;
    const { nodeId, selected } = event.detail;
    const node = this.nodeMap.get(nodeId);

    if (!node) return;

    if (this.selectionMode === 'none') return;

    if (this.selectionMode === 'single') {
      // Deselect all other nodes
      this.selectedNodes = selected ? [nodeId] : [];
    } else {
      // Multiple selection
      if (selected) {
        if (!this.selectedNodes.includes(nodeId)) {
          this.selectedNodes = [...this.selectedNodes, nodeId];
        }
      } else {
        this.selectedNodes = this.selectedNodes.filter(id => id !== nodeId);
      }
    }

    this.dispatchSelectEvent(nodeId, node);
  }

  private handleItemCheck(e: Event) {
    const event = e as CustomEvent;
    const { nodeId, checked } = event.detail;
    const node = this.nodeMap.get(nodeId);

    if (!node) return;

    if (checked) {
      if (!this.checkedNodes.includes(nodeId)) {
        this.checkedNodes = [...this.checkedNodes, nodeId];
      }
    } else {
      this.checkedNodes = this.checkedNodes.filter(id => id !== nodeId);
    }

    this.dispatchCheckEvent(nodeId, node, checked);
  }

  private handleLazyLoad(e: Event) {
    const event = e as CustomEvent;
    const { nodeId, node } = event.detail;
    this.dispatchLazyLoadEvent(nodeId, node);
  }

  @dispatch('@snice/tree-node-expand', { bubbles: true, composed: true })
  private dispatchExpandEvent(nodeId: string, node: TreeNode): TreeNodeExpandDetail {
    return { nodeId, node, tree: this };
  }

  @dispatch('@snice/tree-node-collapse', { bubbles: true, composed: true })
  private dispatchCollapseEvent(nodeId: string, node: TreeNode): TreeNodeCollapseDetail {
    return { nodeId, node, tree: this };
  }

  @dispatch('@snice/tree-node-select', { bubbles: true, composed: true })
  private dispatchSelectEvent(nodeId: string, node: TreeNode): TreeNodeSelectDetail {
    return { nodeId, node, selectedNodes: this.getSelectedNodes(), tree: this };
  }

  @dispatch('@snice/tree-node-check', { bubbles: true, composed: true })
  private dispatchCheckEvent(nodeId: string, node: TreeNode, checked: boolean): TreeNodeCheckDetail {
    return { nodeId, node, checked, checkedNodes: this.getCheckedNodes(), tree: this };
  }

  @dispatch('@snice/tree-node-lazy-load', { bubbles: true, composed: true })
  private dispatchLazyLoadEvent(nodeId: string, node: TreeNode): TreeNodeLazyLoadDetail {
    return { nodeId, node, tree: this };
  }

  @render()
  render() {
    const treeClasses = [
      'tree'
    ].filter(Boolean).join(' ');

    return html`
      <div class="${treeClasses}" part="container" role="tree">
        <div class="tree__content" part="content">
          <if ${this.nodes.length === 0}>
            <div class="tree__empty" part="empty">No items to display</div>
          </if>
          <if ${this.nodes.length > 0}>
            ${this.nodes.map(node => html`
              <snice-tree-item
                .node="${node}"
                .level="${0}"
                .showCheckbox="${this.showCheckboxes}"
                .showIcon="${this.showIcons}">
              </snice-tree-item>
            `)}
          </if>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Public API
  expandNode(id: string) {
    const node = this.nodeMap.get(id);
    if (!node || !node.children) return;

    node.expanded = true;
    this.nodes = [...this.nodes];
    this.dispatchExpandEvent(id, node);
  }

  collapseNode(id: string) {
    const node = this.nodeMap.get(id);
    if (!node || !node.children) return;

    node.expanded = false;
    this.nodes = [...this.nodes];
    this.dispatchCollapseEvent(id, node);
  }

  toggleNode(id: string) {
    const node = this.nodeMap.get(id);
    if (!node || !node.children) return;

    if (node.expanded) {
      this.collapseNode(id);
    } else {
      this.expandNode(id);
    }
  }

  expandAll() {
    const expandRecursive = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          node.expanded = true;
          expandRecursive(node.children);
        }
      }
    };

    expandRecursive(this.nodes);
    this.nodes = [...this.nodes];
  }

  collapseAll() {
    const collapseRecursive = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        node.expanded = false;
        if (node.children) {
          collapseRecursive(node.children);
        }
      }
    };

    collapseRecursive(this.nodes);
    this.nodes = [...this.nodes];
  }

  selectNode(id: string) {
    if (this.selectionMode === 'none') return;

    const node = this.nodeMap.get(id);
    if (!node) return;

    if (this.selectionMode === 'single') {
      this.selectedNodes = [id];
    } else {
      if (!this.selectedNodes.includes(id)) {
        this.selectedNodes = [...this.selectedNodes, id];
      }
    }

    this.dispatchSelectEvent(id, node);
  }

  deselectNode(id: string) {
    const node = this.nodeMap.get(id);
    if (!node) return;

    this.selectedNodes = this.selectedNodes.filter(nodeId => nodeId !== id);
    this.dispatchSelectEvent(id, node);
  }

  toggleSelection(id: string) {
    if (this.selectedNodes.includes(id)) {
      this.deselectNode(id);
    } else {
      this.selectNode(id);
    }
  }

  checkNode(id: string) {
    const node = this.nodeMap.get(id);
    if (!node) return;

    if (!this.checkedNodes.includes(id)) {
      this.checkedNodes = [...this.checkedNodes, id];
    }

    this.dispatchCheckEvent(id, node, true);
  }

  uncheckNode(id: string) {
    const node = this.nodeMap.get(id);
    if (!node) return;

    this.checkedNodes = this.checkedNodes.filter(nodeId => nodeId !== id);
    this.dispatchCheckEvent(id, node, false);
  }

  toggleCheck(id: string) {
    if (this.checkedNodes.includes(id)) {
      this.uncheckNode(id);
    } else {
      this.checkNode(id);
    }
  }

  getNode(id: string): TreeNode | undefined {
    return this.nodeMap.get(id);
  }

  getSelectedNodes(): TreeNode[] {
    return this.selectedNodes.map(id => this.nodeMap.get(id)).filter(Boolean) as TreeNode[];
  }

  getCheckedNodes(): TreeNode[] {
    return this.checkedNodes.map(id => this.nodeMap.get(id)).filter(Boolean) as TreeNode[];
  }
}
