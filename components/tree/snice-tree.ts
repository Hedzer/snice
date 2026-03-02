import { element, property, watch, ready, queryAll, dispatch, on } from 'snice';
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
  @property({ type: Boolean })
  selectable = true;

  @property({  })
  selectionMode: TreeSelectionMode = 'single';

  @property({ type: Boolean, attribute: 'show-checkboxes' })
  showCheckboxes = false;

  @property({ type: Boolean, attribute: 'show-icons' })
  showIcons = true;

  @property({ type: Boolean, attribute: 'expand-on-click' })
  expandOnClick = false;

  @property({ type: Array, attribute: false })
  nodes: TreeNode[] = [];

  @property({ type: Array, attribute: false })
  selectedNodes: string[] = [];

  @property({ type: Array, attribute: false })
  checkedNodes: string[] = [];

  private nodeMap = new Map<string, TreeNode>();

  @queryAll('snice-tree-item')
  treeItems!: NodeListOf<HTMLElement>;

  private lastFocusedItem: HTMLElement | null = null;

  // NOTE: We don't use @render() here because it causes full re-renders
  // which destroys the tree structure when properties change. Instead, we
  // manually create the initial DOM and update it as needed.

  @ready()
  init() {
    this.buildNodeMap();
    this.syncNodeStates();

    // Create initial DOM structure
    this.renderTemplate();

    // Set ARIA attributes
    this.setAttribute('role', 'tree');
    this.setAttribute('tabindex', '0');
    if (this.selectionMode === 'multiple') {
      this.setAttribute('aria-multiselectable', 'true');
    }

    // Create tree items and set node data
    this.updateTreeItemsDOM();
  }

  private renderTemplate() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.shadowRoot!.innerHTML = `
      <style>${cssContent}</style>
      <div class="tree" part="container" role="tree">
        <div class="tree__content" part="content"></div>
      </div>
    `;
  }

  private loadingNodeIds = new Set<string>();

  @watch('nodes')
  handleNodesChange() {
    this.buildNodeMap();
    this.syncNodeStates();

    // Track which nodes are currently loading before clearing DOM
    this.trackLoadingNodes();

    this.updateTreeItemsDOM();

    // Restore loading state and finish any completed loads
    requestAnimationFrame(() => {
      this.restoreLoadingState();
      requestAnimationFrame(() => {
        this.finishLoadingNodes();
      });
    });
  }

  private trackLoadingNodes() {
    const checkItem = (item: any) => {
      if (!item || !item.node) return;
      if (item.loading) {
        this.loadingNodeIds.add(item.node.id);
      }
      if (item.shadowRoot) {
        const childItems = item.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item');
        childItems.forEach((child: any) => checkItem(child));
      }
    };

    const rootItems = this.shadowRoot?.querySelectorAll('.tree__content > snice-tree-item');
    rootItems?.forEach((item: any) => checkItem(item));
  }

  private restoreLoadingState() {
    const restoreItem = (item: any) => {
      if (!item || !item.node) return;

      // Restore loading state if this node was loading
      if (this.loadingNodeIds.has(item.node.id)) {
        item.loading = true;
      }

      // Recursively restore children
      if (item.shadowRoot) {
        const childItems = item.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item');
        childItems.forEach((child: any) => restoreItem(child));
      }
    };

    const rootItems = this.shadowRoot?.querySelectorAll('.tree__content > snice-tree-item');
    rootItems?.forEach((item: any) => restoreItem(item));
  }

  private updateTreeItemsDOM() {
    if (!this.shadowRoot) return;

    const content = this.shadowRoot.querySelector('.tree__content');
    if (!content) return;

    // Clear existing items
    content.innerHTML = '';

    // Create tree items for root nodes
    this.nodes.forEach(node => {
      const item = document.createElement('snice-tree-item');
      if (this.showCheckboxes) item.setAttribute('show-checkbox', '');
      if (this.showIcons) item.setAttribute('show-icon', '');
      content.appendChild(item);
    });

    // Update items with node data
    this.updateTreeItems();
  }

  private updateTreeItems() {
    // Wait for next frame to ensure elements are rendered
    requestAnimationFrame(() => {
      if (!this.treeItems || this.treeItems.length === 0) {
        // Fallback to manual query if @queryAll hasn't populated yet
        const items = this.shadowRoot?.querySelectorAll('.tree > .tree__content > snice-tree-item');
        if (items) {
          items.forEach((item, index) => {
            if (this.nodes[index] && (item as any).setNode) {
              (item as any).setNode(this.nodes[index], 0);
            }
          });
        }
      } else {
        this.treeItems.forEach((item, index) => {
          if (this.nodes[index] && (item as any).setNode) {
            (item as any).setNode(this.nodes[index], 0);
          }
        });
      }
    });
  }

  @watch('selectedNodes')
  handleSelectedNodesChange() {
    this.syncNodeStates();
    // Update tree item selected states
    requestAnimationFrame(() => {
      this.updateSelectedStatesOnly();
    });
  }

  @watch('checkedNodes')
  handleCheckedNodesChange() {
    this.syncNodeStates();
    // Update tree item checkbox states
    requestAnimationFrame(() => {
      this.updateCheckboxStatesOnly();
    });
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

  @on('tree-item-toggle')
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

  @on('tree-item-select')
  private handleItemSelect(e: Event) {
    const event = e as CustomEvent;
    const { nodeId, selected } = event.detail;
    const node = this.nodeMap.get(nodeId);

    if (!node) return;

    // Check if selection is disabled
    if (!this.selectable || this.selectionMode === 'none') return;

    if (this.selectionMode === 'single') {
      // Deselect all nodes first
      this.deselectAllNodes();

      // Select only the clicked node if selecting
      if (selected) {
        node.selected = true;
        this.selectedNodes = [nodeId];
      } else {
        node.selected = false;
        this.selectedNodes = [];
      }

      // Update DOM to reflect changes
      this.updateSelectedStatesOnly();
    } else {
      // Multiple selection
      if (selected) {
        node.selected = true;
        if (!this.selectedNodes.includes(nodeId)) {
          this.selectedNodes = [...this.selectedNodes, nodeId];
        }
      } else {
        node.selected = false;
        this.selectedNodes = this.selectedNodes.filter(id => id !== nodeId);
      }

      // Update DOM
      this.updateSelectedStatesOnly();
    }

    this.dispatchSelectEvent(nodeId, node);
  }

  private deselectAllNodes() {
    // Recursively deselect all nodes
    const deselect = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        node.selected = false;
        if (node.children) {
          deselect(node.children);
        }
      }
    };
    deselect(this.nodes);
  }

  @on('tree-item-check')
  private handleItemCheck(e: Event) {
    const event = e as CustomEvent;
    const { nodeId, checked } = event.detail;
    const node = this.nodeMap.get(nodeId);

    if (!node) return;

    // Update checked state with cascading
    this.syncCheckboxes(node, checked);

    this.dispatchCheckEvent(nodeId, node, checked);
  }

  private syncCheckboxes(changedNode: TreeNode, checked: boolean) {
    // Update descendants
    const updateDescendants = (node: TreeNode, isChecked: boolean) => {
      node.checked = isChecked;
      if (isChecked && !this.checkedNodes.includes(node.id)) {
        this.checkedNodes = [...this.checkedNodes, node.id];
      } else if (!isChecked) {
        this.checkedNodes = this.checkedNodes.filter(id => id !== node.id);
      }

      if (node.children) {
        for (const child of node.children) {
          if (!child.disabled) {
            updateDescendants(child, isChecked);
          }
        }
      }
    };

    // Update ancestors with indeterminate state
    const updateAncestors = (node: TreeNode) => {
      const parent = this.findParentNode(node.id);
      if (!parent) return;

      const children = parent.children || [];
      const checkedChildren = children.filter(c => c.checked && !c.disabled);
      const uncheckedChildren = children.filter(c => !c.checked && !c.disabled && !c.indeterminate);

      const allChecked = checkedChildren.length === children.filter(c => !c.disabled).length;
      const allUnchecked = uncheckedChildren.length === children.filter(c => !c.disabled).length;

      parent.checked = allChecked;
      parent.indeterminate = !allChecked && !allUnchecked;

      if (parent.checked && !this.checkedNodes.includes(parent.id)) {
        this.checkedNodes = [...this.checkedNodes, parent.id];
      } else if (!parent.checked && !parent.indeterminate) {
        this.checkedNodes = this.checkedNodes.filter(id => id !== parent.id);
      }

      updateAncestors(parent);
    };

    updateDescendants(changedNode, checked);
    updateAncestors(changedNode);

    // Update checkbox states without re-rendering
    this.updateCheckboxStatesOnly();
  }

  private updateCheckboxStatesOnly() {
    // Recursively update all tree-item checkbox states without re-rendering
    const updateItemCheckboxes = (item: any) => {
      if (!item || !item.node) return;

      const node = this.nodeMap.get(item.node.id);
      if (!node) return;

      // Update the item's properties directly
      if (item.checked !== node.checked) {
        item.checked = node.checked;
      }
      if (item.indeterminate !== node.indeterminate) {
        item.indeterminate = node.indeterminate;
      }

      // Recursively update children
      if (item.shadowRoot) {
        const childItems = item.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item');
        childItems.forEach((child: any) => updateItemCheckboxes(child));
      }
    };

    // Start with root items
    const rootItems = this.shadowRoot?.querySelectorAll('.tree__content > snice-tree-item');
    rootItems?.forEach((item: any) => updateItemCheckboxes(item));
  }

  private updateSelectedStatesOnly() {
    // Recursively update all tree-item selected states without re-rendering
    const updateItemSelection = (item: any) => {
      if (!item || !item.node) return;

      const node = this.nodeMap.get(item.node.id);
      if (!node) return;

      // Always update the item's selected property and DOM
      item.selected = node.selected;

      // Force update the DOM class
      if (item.shadowRoot) {
        const content = item.shadowRoot.querySelector('.tree-item__content');
        if (content) {
          if (node.selected) {
            content.classList.add('tree-item__content--selected');
          } else {
            content.classList.remove('tree-item__content--selected');
          }
          content.setAttribute('aria-selected', (node.selected ?? false).toString());
        }
      }

      // Recursively update children
      if (item.shadowRoot) {
        const childItems = item.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item');
        childItems.forEach((child: any) => updateItemSelection(child));
      }
    };

    // Start with root items
    const rootItems = this.shadowRoot?.querySelectorAll('.tree__content > snice-tree-item');
    rootItems?.forEach((item: any) => updateItemSelection(item));
  }

  private finishLoadingNodes() {
    // Find any tree items with loading state and finish loading if they now have children
    const finishItem = (item: any) => {
      if (!item || !item.node) return;

      // If this item is loading and now has children, finish loading
      if (item.loading && item.node.children && item.node.children.length > 0) {
        item.finishLoading();
        // Remove from loading set
        this.loadingNodeIds.delete(item.node.id);
      }

      // Check children
      if (item.shadowRoot) {
        const childItems = item.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item');
        childItems.forEach((child: any) => finishItem(child));
      }
    };

    // Start with root items
    const rootItems = this.shadowRoot?.querySelectorAll('.tree__content > snice-tree-item');
    rootItems?.forEach((item: any) => finishItem(item));
  }

  private findParentNode(nodeId: string): TreeNode | null {
    const findParent = (nodes: TreeNode[], targetId: string): TreeNode | null => {
      for (const node of nodes) {
        if (node.children) {
          if (node.children.some(child => child.id === targetId)) {
            return node;
          }
          const found = findParent(node.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    return findParent(this.nodes, nodeId);
  }

  @on('tree-item-lazy-load')
  private handleLazyLoad(e: Event) {
    const event = e as CustomEvent;
    const { nodeId, node } = event.detail;
    this.dispatchLazyLoadEvent(nodeId, node);
  }

  @dispatch('tree-node-expand', { bubbles: true, composed: true })
  private dispatchExpandEvent(nodeId: string, node: TreeNode): TreeNodeExpandDetail {
    return { nodeId, node, tree: this };
  }

  @dispatch('tree-node-collapse', { bubbles: true, composed: true })
  private dispatchCollapseEvent(nodeId: string, node: TreeNode): TreeNodeCollapseDetail {
    return { nodeId, node, tree: this };
  }

  @dispatch('tree-node-select', { bubbles: true, composed: true })
  private dispatchSelectEvent(nodeId: string, node: TreeNode): TreeNodeSelectDetail {
    return { nodeId, node, selectedNodes: this.getSelectedNodes(), tree: this };
  }

  @dispatch('tree-node-check', { bubbles: true, composed: true })
  private dispatchCheckEvent(nodeId: string, node: TreeNode, checked: boolean): TreeNodeCheckDetail {
    return { nodeId, node, checked, checkedNodes: this.getCheckedNodes(), tree: this };
  }

  @dispatch('tree-node-lazy-load', { bubbles: true, composed: true })
  private dispatchLazyLoadEvent(nodeId: string, node: TreeNode): TreeNodeLazyLoadDetail {
    return { nodeId, node, tree: this };
  }

  // Keyboard navigation
  @on('keydown')
  private handleKeyDown(event: KeyboardEvent) {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
      return;
    }

    // Ignore when focus is in a text field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const items = this.getFocusableItems();
    if (items.length === 0) return;

    event.preventDefault();
    const activeIndex = items.findIndex(item => item.matches(':focus'));
    const activeItem = items[activeIndex];

    const focusItemAt = (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      items[clampedIndex]?.focus();
    };

    if (event.key === 'ArrowDown') {
      focusItemAt(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      focusItemAt(activeIndex - 1);
    } else if (event.key === 'ArrowRight') {
      if (activeItem && (activeItem as any).expand) {
        (activeItem as any).expand();
      }
    } else if (event.key === 'ArrowLeft') {
      if (activeItem && (activeItem as any).collapse) {
        (activeItem as any).collapse();
      }
    } else if (event.key === 'Home') {
      focusItemAt(0);
    } else if (event.key === 'End') {
      focusItemAt(items.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (activeItem && (activeItem as any).select) {
        (activeItem as any).select();
      }
    }
  }

  @on('focusin')
  private handleFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;

    // If tree gets focus, move to last focused item or first item
    if (target === this) {
      const items = this.getFocusableItems();
      const itemToFocus = this.lastFocusedItem || items[0];
      itemToFocus?.focus();
      return;
    }

    // Update roving tabindex
    if (target.tagName === 'SNICE-TREE-ITEM') {
      if (this.lastFocusedItem) {
        this.lastFocusedItem.setAttribute('tabindex', '-1');
      }
      this.lastFocusedItem = target;
      this.setAttribute('tabindex', '-1');
      target.setAttribute('tabindex', '0');
    }
  }

  @on('focusout')
  private handleFocusOut(event: FocusEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget || !this.contains(relatedTarget)) {
      this.setAttribute('tabindex', '0');
    }
  }

  private getFocusableItems(): HTMLElement[] {
    const allItems = Array.from(this.shadowRoot?.querySelectorAll('snice-tree-item') || []) as HTMLElement[];
    const collapsedItems = new Set<HTMLElement>();

    return allItems.filter(item => {
      const disabled = (item as any).node?.disabled;
      if (disabled) return false;

      // Check if parent is collapsed
      let parent = item.parentElement;
      while (parent && parent !== this) {
        if (parent.tagName === 'SNICE-TREE-ITEM') {
          const parentExpanded = (parent as any).expanded;
          if (!parentExpanded) {
            collapsedItems.add(item);
            return false;
          }
        }
        parent = parent.parentElement;
      }

      return !collapsedItems.has(item);
    });
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
    if (!this.selectable || this.selectionMode === 'none') return;

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

  updateNode(id: string, updates: Partial<TreeNode>) {
    // Create a new nodes array with the updated node
    const updateInTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          // Found the node - create a new node with updates
          return { ...node, ...updates };
        }
        if (node.children) {
          // Recursively update children
          const newChildren = updateInTree(node.children);
          if (newChildren !== node.children) {
            // Children were updated, create new node
            return { ...node, children: newChildren };
          }
        }
        return node;
      });
    };

    // Update and trigger re-render
    this.nodes = updateInTree(this.nodes);
  }
}
