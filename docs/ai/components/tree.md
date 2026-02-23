# snice-tree

Hierarchical tree view with expandable nodes, selection, checkboxes, and lazy loading.

## Properties

```typescript
nodes: TreeNode[] = [];
selectionMode: 'single'|'multiple'|'none' = 'single'; // attr: selection-mode
showCheckboxes: boolean = false;  // attr: show-checkboxes
showIcons: boolean = true;        // attr: show-icons
expandOnClick: boolean = false;   // attr: expand-on-click
selectedNodes: string[] = [];     // attr: selected-nodes
checkedNodes: string[] = [];      // attr: checked-nodes

interface TreeNode {
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
```

## Events

- `tree-node-expand` → `{ nodeId, node, tree }`
- `tree-node-collapse` → `{ nodeId, node, tree }`
- `tree-node-select` → `{ nodeId, node, selectedNodes, tree }`
- `tree-node-check` → `{ nodeId, node, checked, checkedNodes, tree }`
- `tree-node-lazy-load` → `{ nodeId, node, tree }`

## Methods

- `expandNode(id)` / `collapseNode(id)` / `toggleNode(id)`
- `expandAll()` / `collapseAll()`
- `selectNode(id)` / `deselectNode(id)` / `toggleSelection(id)`
- `checkNode(id)` / `uncheckNode(id)` / `toggleCheck(id)`
- `getNode(id)` - Get node by ID
- `getSelectedNodes()` - Get selected nodes
- `getCheckedNodes()` - Get checked nodes

## Usage

```html
<snice-tree id="tree" selection-mode="single"></snice-tree>
<script>
  document.getElementById('tree').nodes = [
    {
      id: 'src', label: 'src', icon: '📁', expanded: true,
      children: [
        { id: 'index.ts', label: 'index.ts', icon: '📄' },
        { id: 'main.ts', label: 'main.ts', icon: '📄' }
      ]
    }
  ];
</script>

<snice-tree selection-mode="multiple" show-checkboxes></snice-tree>
<snice-tree show-icons="false" expand-on-click></snice-tree>
```
