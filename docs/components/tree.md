<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/tree.md -->

# Tree
`<snice-tree>`

Displays hierarchical data with expandable/collapsible nodes, selection, checkboxes, icons, and lazy loading.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selectable` | `boolean` | `true` | Enable or disable node selection |
| `selectionMode` (attr: `selection-mode`) | `'single' \| 'multiple' \| 'none'` | `'single'` | Selection behavior |
| `showCheckboxes` (attr: `show-checkboxes`) | `boolean` | `false` | Display checkboxes |
| `showIcons` (attr: `show-icons`) | `boolean` | `true` | Display node icons |
| `expandOnClick` (attr: `expand-on-click`) | `boolean` | `false` | Expand/collapse on node click |
| `nodes` | `TreeNode[]` | `[]` | Array of tree nodes |
| `selectedNodes` (attr: `selected-nodes`) | `string[]` | `[]` | Selected node IDs |
| `checkedNodes` (attr: `checked-nodes`) | `string[]` | `[]` | Checked node IDs |

### TreeNode Interface

```typescript
interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  iconImage?: string;
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

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `expandNode()` | `id: string` | Expand a node |
| `collapseNode()` | `id: string` | Collapse a node |
| `toggleNode()` | `id: string` | Toggle expand/collapse |
| `expandAll()` | -- | Expand all nodes |
| `collapseAll()` | -- | Collapse all nodes |
| `selectNode()` | `id: string` | Select a node |
| `deselectNode()` | `id: string` | Deselect a node |
| `toggleSelection()` | `id: string` | Toggle selection |
| `checkNode()` | `id: string` | Check a node |
| `uncheckNode()` | `id: string` | Uncheck a node |
| `toggleCheck()` | `id: string` | Toggle checked state |
| `getNode()` | `id: string` | Get node object |
| `getSelectedNodes()` | -- | Get all selected nodes |
| `getCheckedNodes()` | -- | Get all checked nodes |
| `updateNode()` | `id: string, updates: Partial<TreeNode>` | Update a node's properties |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `tree-node-expand` | `{ nodeId: string, node: TreeNode, tree }` | Node expanded |
| `tree-node-collapse` | `{ nodeId: string, node: TreeNode, tree }` | Node collapsed |
| `tree-node-select` | `{ nodeId: string, node: TreeNode, selectedNodes: TreeNode[], tree }` | Node selected |
| `tree-node-check` | `{ nodeId: string, node: TreeNode, checked: boolean, checkedNodes: TreeNode[], tree }` | Checkbox toggled |
| `tree-node-lazy-load` | `{ nodeId: string, node: TreeNode, tree }` | Lazy node expanded |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | Main tree container |
| `content` | Tree content area |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--tree-max-height` | Maximum height of the tree | `100%` |

## Basic Usage

```typescript
import 'snice/components/tree/snice-tree';
```

```html
<snice-tree></snice-tree>
```

```typescript
tree.nodes = [
  {
    id: 'src',
    label: 'src',
    icon: '📁',
    expanded: true,
    children: [
      { id: 'index.ts', label: 'index.ts', icon: '📄' },
      { id: 'main.ts', label: 'main.ts', icon: '📄' }
    ]
  }
];
```

## Examples

### Single Selection

Use `selection-mode="single"` to allow selecting one node at a time.

```html
<snice-tree selection-mode="single"></snice-tree>
```

```typescript
tree.nodes = [
  { id: '1', label: 'Item 1' },
  { id: '2', label: 'Item 2' },
  { id: '3', label: 'Item 3' }
];
tree.addEventListener('tree-node-select', (e) => {
  console.log('Selected:', e.detail.node.label);
});
```

### Multiple Selection

Use `selection-mode="multiple"` to allow selecting multiple nodes.

```html
<snice-tree selection-mode="multiple"></snice-tree>
```

### Checkboxes

Set the `show-checkboxes` attribute to display checkboxes for multi-select.

```html
<snice-tree show-checkboxes></snice-tree>
```

```typescript
tree.nodes = [
  {
    id: 'features',
    label: 'Features',
    children: [
      { id: 'dark-mode', label: 'Dark Mode' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'auto-save', label: 'Auto-save' }
    ]
  }
];
```

### Lazy Loading

Set `lazy: true` on nodes to load children on demand.

```typescript
tree.nodes = [
  { id: 'folder', label: 'Click to load...', icon: '📁', lazy: true, children: [] }
];

tree.addEventListener('tree-node-lazy-load', async (e) => {
  const node = e.detail.node;
  const data = await fetch(`/api/nodes/${node.id}`).then(r => r.json());
  node.children = data.map(item => ({ id: item.id, label: item.name, icon: '📄' }));
  node.lazy = false;
  node.expanded = true;
  tree.nodes = [...tree.nodes];
});
```

### Expand on Click

Set the `expand-on-click` attribute so clicking a node toggles its expansion.

```html
<snice-tree expand-on-click></snice-tree>
```

### Without Icons

Set `show-icons="false"` to hide node icons.

```html
<snice-tree show-icons="false"></snice-tree>
```

### Programmatic Control

```typescript
tree.expandAll();
tree.collapseAll();
tree.expandNode('folder1');
tree.selectNode('file1');
tree.checkNode('feature1');

const selected = tree.getSelectedNodes();
const checked = tree.getCheckedNodes();
const node = tree.getNode('file1');
```
