# Tree Component

The tree component displays hierarchical data with expandable/collapsible nodes, support for selection (single/multiple), checkboxes, icons, and lazy loading.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Data Structure](#data-structure)
- [Examples](#examples)

## Basic Usage

```html
<snice-tree id="myTree"></snice-tree>

<script>
  const tree = document.getElementById('myTree');
  tree.nodes = [
    {
      id: 'root',
      label: 'Root Folder',
      icon: '📁',
      expanded: true,
      children: [
        { id: 'file1', label: 'file1.txt', icon: '📄' },
        { id: 'file2', label: 'file2.txt', icon: '📄' }
      ]
    }
  ];
</script>
```

```typescript
import 'snice/components/tree/snice-tree';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `nodes` | `TreeNode[]` | `[]` | Array of tree nodes to display |
| `selectionMode` | `'single' \| 'multiple' \| 'none'` | `'single'` | Selection behavior |
| `showCheckboxes` | `boolean` | `false` | Display checkboxes for multi-select |
| `showIcons` | `boolean` | `true` | Display node icons |
| `expandOnClick` | `boolean` | `false` | Expand/collapse on node click |
| `selectedNodes` | `string[]` | `[]` | Array of selected node IDs |
| `checkedNodes` | `string[]` | `[]` | Array of checked node IDs |

## Methods

### Expand/Collapse

#### `expandNode(id: string): void`
Expand a specific node by ID.

```typescript
tree.expandNode('folder1');
```

#### `collapseNode(id: string): void`
Collapse a specific node by ID.

```typescript
tree.collapseNode('folder1');
```

#### `toggleNode(id: string): void`
Toggle a node's expanded state.

```typescript
tree.toggleNode('folder1');
```

#### `expandAll(): void`
Expand all nodes in the tree.

```typescript
tree.expandAll();
```

#### `collapseAll(): void`
Collapse all nodes in the tree.

```typescript
tree.collapseAll();
```

### Selection

#### `selectNode(id: string): void`
Select a node by ID.

```typescript
tree.selectNode('file1');
```

#### `deselectNode(id: string): void`
Deselect a node by ID.

```typescript
tree.deselectNode('file1');
```

#### `toggleSelection(id: string): void`
Toggle a node's selection state.

```typescript
tree.toggleSelection('file1');
```

### Checkboxes

#### `checkNode(id: string): void`
Check a node by ID.

```typescript
tree.checkNode('file1');
```

#### `uncheckNode(id: string): void`
Uncheck a node by ID.

```typescript
tree.uncheckNode('file1');
```

#### `toggleCheck(id: string): void`
Toggle a node's checked state.

```typescript
tree.toggleCheck('file1');
```

### Getters

#### `getNode(id: string): TreeNode | undefined`
Get a node object by ID.

```typescript
const node = tree.getNode('file1');
console.log(node.label);
```

#### `getSelectedNodes(): TreeNode[]`
Get all selected nodes.

```typescript
const selected = tree.getSelectedNodes();
console.log(selected.map(n => n.label));
```

#### `getCheckedNodes(): TreeNode[]`
Get all checked nodes.

```typescript
const checked = tree.getCheckedNodes();
console.log(checked.map(n => n.label));
```

## Events

### `@snice/tree-node-expand`
Fired when a node is expanded.

**Event Detail:**
```typescript
{
  nodeId: string;
  node: TreeNode;
  tree: SniceTreeElement;
}
```

### `@snice/tree-node-collapse`
Fired when a node is collapsed.

**Event Detail:**
```typescript
{
  nodeId: string;
  node: TreeNode;
  tree: SniceTreeElement;
}
```

### `@snice/tree-node-select`
Fired when a node is selected.

**Event Detail:**
```typescript
{
  nodeId: string;
  node: TreeNode;
  selectedNodes: TreeNode[];
  tree: SniceTreeElement;
}
```

### `@snice/tree-node-check`
Fired when a node checkbox is toggled.

**Event Detail:**
```typescript
{
  nodeId: string;
  node: TreeNode;
  checked: boolean;
  checkedNodes: TreeNode[];
  tree: SniceTreeElement;
}
```

### `@snice/tree-node-lazy-load`
Fired when a lazy-loading node is expanded.

**Event Detail:**
```typescript
{
  nodeId: string;
  node: TreeNode;
  tree: SniceTreeElement;
}
```

## Data Structure

### TreeNode Interface

```typescript
interface TreeNode {
  id: string;              // Unique identifier
  label: string;           // Display text
  icon?: string;           // Text/emoji icon
  iconImage?: string;      // Icon image URL
  children?: TreeNode[];   // Child nodes
  disabled?: boolean;      // Disable interaction
  selected?: boolean;      // Selection state
  checked?: boolean;       // Checkbox state
  expanded?: boolean;      // Expansion state
  lazy?: boolean;          // Enable lazy loading
  data?: any;             // Custom data
}
```

## Examples

### File System Tree

```html
<snice-tree id="fileTree"></snice-tree>

<script>
  const fileTree = document.getElementById('fileTree');
  fileTree.nodes = [
    {
      id: 'src',
      label: 'src',
      icon: '📁',
      expanded: true,
      children: [
        {
          id: 'components',
          label: 'components',
          icon: '📁',
          children: [
            { id: 'header.ts', label: 'header.ts', icon: '📄' },
            { id: 'footer.ts', label: 'footer.ts', icon: '📄' }
          ]
        },
        { id: 'index.ts', label: 'index.ts', icon: '📄' }
      ]
    }
  ];
</script>
```

### Single Selection

```html
<snice-tree id="singleTree" selection-mode="single"></snice-tree>

<script>
  const tree = document.getElementById('singleTree');
  tree.nodes = [
    { id: '1', label: 'Item 1' },
    { id: '2', label: 'Item 2' },
    { id: '3', label: 'Item 3' }
  ];

  tree.addEventListener('@snice/tree-node-select', (e) => {
    console.log('Selected:', e.detail.node.label);
  });
</script>
```

### Multiple Selection

```html
<snice-tree id="multiTree" selection-mode="multiple"></snice-tree>

<script>
  const tree = document.getElementById('multiTree');
  tree.nodes = [
    { id: '1', label: 'Item 1' },
    { id: '2', label: 'Item 2' },
    { id: '3', label: 'Item 3' }
  ];

  tree.addEventListener('@snice/tree-node-select', (e) => {
    console.log('Selected nodes:', e.detail.selectedNodes.map(n => n.label));
  });
</script>
```

### Checkbox Selection

```html
<snice-tree id="checkboxTree" show-checkboxes></snice-tree>

<script>
  const tree = document.getElementById('checkboxTree');
  tree.nodes = [
    {
      id: 'features',
      label: 'Features',
      children: [
        { id: 'feature1', label: 'Dark Mode' },
        { id: 'feature2', label: 'Notifications' },
        { id: 'feature3', label: 'Auto-save' }
      ]
    }
  ];

  tree.addEventListener('@snice/tree-node-check', (e) => {
    console.log('Checked nodes:', e.detail.checkedNodes.map(n => n.label));
  });
</script>
```

### Lazy Loading

```html
<snice-tree id="lazyTree"></snice-tree>

<script>
  const tree = document.getElementById('lazyTree');
  tree.nodes = [
    {
      id: 'folder1',
      label: 'Click to load...',
      icon: '📁',
      lazy: true,
      children: []
    }
  ];

  tree.addEventListener('@snice/tree-node-lazy-load', async (e) => {
    const node = e.detail.node;

    // Simulate async data loading
    const data = await fetch(`/api/nodes/${node.id}`).then(r => r.json());

    node.children = data.map(item => ({
      id: item.id,
      label: item.name,
      icon: '📄'
    }));
    node.lazy = false;
    node.expanded = true;

    // Trigger re-render
    tree.nodes = [...tree.nodes];
  });
</script>
```

### Programmatic Control

```html
<div>
  <button onclick="tree.expandAll()">Expand All</button>
  <button onclick="tree.collapseAll()">Collapse All</button>
</div>

<snice-tree id="tree"></snice-tree>

<script>
  const tree = document.getElementById('tree');
  tree.nodes = [
    {
      id: 'root',
      label: 'Root',
      children: [
        {
          id: 'branch1',
          label: 'Branch 1',
          children: [
            { id: 'leaf1', label: 'Leaf 1' }
          ]
        }
      ]
    }
  ];
</script>
```

### Organization Chart

```html
<snice-tree id="orgTree"></snice-tree>

<script>
  const orgTree = document.getElementById('orgTree');
  orgTree.nodes = [
    {
      id: 'ceo',
      label: 'CEO - John Smith',
      icon: '👤',
      expanded: true,
      children: [
        {
          id: 'cto',
          label: 'CTO - Jane Doe',
          icon: '👤',
          children: [
            { id: 'dev1', label: 'Developer - Alice', icon: '👤' },
            { id: 'dev2', label: 'Developer - Bob', icon: '👤' }
          ]
        },
        {
          id: 'cfo',
          label: 'CFO - Mike Johnson',
          icon: '👤',
          children: [
            { id: 'acc1', label: 'Accountant - Carol', icon: '👤' }
          ]
        }
      ]
    }
  ];
</script>
```

### Without Icons

```html
<snice-tree id="noIconTree" show-icons="false"></snice-tree>

<script>
  const tree = document.getElementById('noIconTree');
  tree.nodes = [
    {
      id: '1',
      label: 'Chapter 1',
      children: [
        { id: '1.1', label: 'Section 1.1' },
        { id: '1.2', label: 'Section 1.2' }
      ]
    },
    {
      id: '2',
      label: 'Chapter 2',
      children: [
        { id: '2.1', label: 'Section 2.1' }
      ]
    }
  ];
</script>
```

### Custom Icons with Images

```html
<snice-tree id="customIconTree"></snice-tree>

<script>
  const tree = document.getElementById('customIconTree');
  tree.nodes = [
    {
      id: 'images',
      label: 'Images',
      iconImage: '/icons/folder.png',
      children: [
        { id: 'pic1.jpg', label: 'pic1.jpg', iconImage: '/icons/image.png' },
        { id: 'pic2.png', label: 'pic2.png', iconImage: '/icons/image.png' }
      ]
    },
    {
      id: 'documents',
      label: 'Documents',
      iconImage: '/icons/folder.png',
      children: [
        { id: 'doc1.pdf', label: 'doc1.pdf', iconImage: '/icons/pdf.png' }
      ]
    }
  ];
</script>
```

### Disabled Nodes

```html
<snice-tree id="disabledTree"></snice-tree>

<script>
  const tree = document.getElementById('disabledTree');
  tree.nodes = [
    { id: '1', label: 'Active Node' },
    { id: '2', label: 'Disabled Node', disabled: true },
    {
      id: '3',
      label: 'Parent',
      children: [
        { id: '3.1', label: 'Active Child' },
        { id: '3.2', label: 'Disabled Child', disabled: true }
      ]
    }
  ];
</script>
```

## Accessibility

- Supports keyboard navigation (Arrow keys, Home, End)
- Proper ARIA attributes (`role="tree"`, `role="treeitem"`, `aria-expanded`, `aria-selected`)
- Focus management for keyboard users
- Screen reader announcements for state changes

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with Custom Elements v1 support
