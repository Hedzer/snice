# snice-tree

Hierarchical tree view with expandable nodes, selection, checkboxes, and lazy loading.

## Properties

```typescript
selectable: boolean = true;
selectionMode: 'single'|'multiple'|'none' = 'single'; // attr: selection-mode
showCheckboxes: boolean = false;  // attr: show-checkboxes
showIcons: boolean = true;        // attr: show-icons
expandOnClick: boolean = false;   // attr: expand-on-click
nodes: TreeNode[] = [];
selectedNodes: string[] = [];     // JS-only; no attribute
checkedNodes: string[] = [];      // JS-only; no attribute

interface TreeNode {
  id: string;
  label: string;
  icon?: string;       // literal text/emoji; never HTML
  iconImage?: string;  // relative, HTTP(S), blob, or raster data-image URL
  children?: TreeNode[];
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean;
  indeterminate?: boolean;
  expanded?: boolean;
  lazy?: boolean;
  data?: any;
}
```

- `iconImage` takes precedence; `icon` is the load-error fallback.
- Unsafe/malformed image sources and SVG data payloads are rejected.

## Methods

- `expandNode(id)` / `collapseNode(id)` / `toggleNode(id)`
- `expandAll()` / `collapseAll()`
- `selectNode(id)` / `deselectNode(id)` / `toggleSelection(id)`
- `checkNode(id)` / `uncheckNode(id)` / `toggleCheck(id)`
- `getNode(id)` - Get node by ID
- `getSelectedNodes()` - Get selected nodes
- `getCheckedNodes()` - Get checked nodes
- `updateNode(id, updates)` - Update node properties

## Events

- `tree-node-expand` -> `{ nodeId, node, tree }`
- `tree-node-collapse` -> `{ nodeId, node, tree }`
- `tree-node-select` -> `{ nodeId, node, selectedNodes, tree }`
- `tree-node-check` -> `{ nodeId, node, checked, checkedNodes, tree }`
- `tree-node-lazy-load` -> `{ nodeId, node, tree }`

## CSS Parts

- `checkbox` - Node checkbox
- `children` - Nested children container
- `expander` - Expand and collapse control
- `icon-image` - Node icon rendered as an image
- `icon-text` - Node icon rendered as text or inline SVG
- `label` - Text label
- `loading` - Lazy-loading indicator
- `container` - Main tree container
- `content` - Tree content area

## CSS Custom Properties

- `--tree-max-height` - Maximum height of tree (default: `100%`)

## Basic Usage

```html
<snice-tree selection-mode="single"></snice-tree>
<snice-tree selection-mode="multiple" show-checkboxes></snice-tree>
<snice-tree show-icons="false" expand-on-click></snice-tree>
```

```typescript
tree.nodes = [
  {
    id: 'src', label: 'src', icon: '📁', expanded: true,
    children: [
      { id: 'index.ts', label: 'index.ts', icon: '📄' },
      { id: 'main.ts', label: 'main.ts', icon: '📄' }
    ]
  }
];
```

```typescript
tree.nodes = [
  { id: 'docs', label: 'Docs', icon: '📚' },
  { id: 'workspace', label: 'Workspace', icon: '◆', iconImage: '/assets/workspace.png' }
];
```
