<!-- AI: For a low-token version of this doc, use docs/ai/components/tree.md instead -->

# Tree
`<snice-tree>`

Displays hierarchical data with expandable/collapsible nodes, selection, checkboxes, icons, and lazy loading.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/tree/snice-tree';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-tree.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `nodes` | `TreeNode[]` | `[]` | Array of tree nodes |
| `selectionMode` (attr: `selection-mode`) | `'single' \| 'multiple' \| 'none'` | `'single'` | Selection behavior |
| `showCheckboxes` (attr: `show-checkboxes`) | `boolean` | `false` | Display checkboxes |
| `showIcons` (attr: `show-icons`) | `boolean` | `true` | Display node icons |
| `expandOnClick` (attr: `expand-on-click`) | `boolean` | `false` | Expand/collapse on node click |
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

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `tree-node-expand` | `{ nodeId: string, node: TreeNode, tree }` | Node expanded |
| `tree-node-collapse` | `{ nodeId: string, node: TreeNode, tree }` | Node collapsed |
| `tree-node-select` | `{ nodeId: string, node: TreeNode, selectedNodes: TreeNode[], tree }` | Node selected |
| `tree-node-check` | `{ nodeId: string, node: TreeNode, checked: boolean, checkedNodes: TreeNode[], tree }` | Checkbox toggled |
| `tree-node-lazy-load` | `{ nodeId: string, node: TreeNode, tree }` | Lazy node expanded |

## Basic Usage

```typescript
import 'snice/components/tree/snice-tree';
```

```html
<snice-tree id="file-tree"></snice-tree>

<script>
  document.getElementById('file-tree').nodes = [
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
</script>
```

## Examples

### Single Selection

Use `selection-mode="single"` to allow selecting one node at a time.

```html
<snice-tree id="single-tree" selection-mode="single"></snice-tree>

<script>
  const tree = document.getElementById('single-tree');
  tree.nodes = [
    { id: '1', label: 'Item 1' },
    { id: '2', label: 'Item 2' },
    { id: '3', label: 'Item 3' }
  ];
  tree.addEventListener('tree-node-select', (e) => {
    console.log('Selected:', e.detail.node.label);
  });
</script>
```

### Multiple Selection

Use `selection-mode="multiple"` to allow selecting multiple nodes.

```html
<snice-tree selection-mode="multiple"></snice-tree>
```

### Checkboxes

Set the `show-checkboxes` attribute to display checkboxes for multi-select.

```html
<snice-tree id="checkbox-tree" show-checkboxes></snice-tree>

<script>
  document.getElementById('checkbox-tree').nodes = [
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
</script>
```

### Lazy Loading

Set `lazy: true` on nodes to load children on demand.

```html
<snice-tree id="lazy-tree"></snice-tree>

<script>
  const tree = document.getElementById('lazy-tree');
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
</script>
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

```javascript
const tree = document.querySelector('snice-tree');
tree.expandAll();
tree.collapseAll();
tree.expandNode('folder1');
tree.selectNode('file1');
tree.checkNode('feature1');

const selected = tree.getSelectedNodes();
const checked = tree.getCheckedNodes();
const node = tree.getNode('file1');
```
