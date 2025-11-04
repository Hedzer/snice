# snice-tree

Hierarchical tree view with expandable nodes, selection, checkboxes, icons, and lazy loading.

## Properties

```typescript
nodes: TreeNode[] = [];
selectionMode: 'single'|'multiple'|'none' = 'single';
showCheckboxes: boolean = false;
showIcons: boolean = true;
expandOnClick: boolean = false;
selectedNodes: string[] = [];
checkedNodes: string[] = [];
```

## TreeNode Interface

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

## Methods

### Expand/Collapse
- `expandNode(id: string)` - Expand a node
- `collapseNode(id: string)` - Collapse a node
- `toggleNode(id: string)` - Toggle node expansion
- `expandAll()` - Expand all nodes
- `collapseAll()` - Collapse all nodes

### Selection
- `selectNode(id: string)` - Select a node
- `deselectNode(id: string)` - Deselect a node
- `toggleSelection(id: string)` - Toggle selection

### Checkboxes
- `checkNode(id: string)` - Check a node
- `uncheckNode(id: string)` - Uncheck a node
- `toggleCheck(id: string)` - Toggle check state

### Getters
- `getNode(id: string): TreeNode | undefined` - Get node by ID
- `getSelectedNodes(): TreeNode[]` - Get all selected nodes
- `getCheckedNodes(): TreeNode[]` - Get all checked nodes

## Events

- `tree-node-expand` - Node expanded (detail: { nodeId, node, tree })
- `tree-node-collapse` - Node collapsed (detail: { nodeId, node, tree })
- `tree-node-select` - Node selected (detail: { nodeId, node, selectedNodes, tree })
- `tree-node-check` - Node checked/unchecked (detail: { nodeId, node, checked, checkedNodes, tree })
- `tree-node-lazy-load` - Lazy node expanded (detail: { nodeId, node, tree })

## Usage

```html
<!-- Basic file tree -->
<snice-tree id="fileTree"></snice-tree>
<script>
  document.getElementById('fileTree').nodes = [
    {
      id: 'src',
      label: 'src',
      icon: '📁',
      expanded: true,
      children: [
        { id: 'index.ts', label: 'index.ts', icon: '📄' },
        {
          id: 'components',
          label: 'components',
          icon: '📁',
          children: [
            { id: 'header.ts', label: 'header.ts', icon: '📄' }
          ]
        }
      ]
    }
  ];
</script>

<!-- Single selection -->
<snice-tree selection-mode="single"></snice-tree>

<!-- Multiple selection -->
<snice-tree selection-mode="multiple"></snice-tree>

<!-- No selection -->
<snice-tree selection-mode="none"></snice-tree>

<!-- Checkbox selection -->
<snice-tree show-checkboxes></snice-tree>

<!-- Without icons -->
<snice-tree show-icons="false"></snice-tree>

<!-- Expand/collapse programmatically -->
<button onclick="tree.expandAll()">Expand All</button>
<button onclick="tree.collapseAll()">Collapse All</button>

<!-- Selection events -->
<snice-tree id="tree"></snice-tree>
<script>
  const tree = document.getElementById('tree');
  tree.addEventListener('tree-node-select', (e) => {
    console.log('Selected:', e.detail.node.label);
    console.log('All selected:', e.detail.selectedNodes.map(n => n.label));
  });
</script>

<!-- Lazy loading -->
<snice-tree id="lazyTree"></snice-tree>
<script>
  const lazyTree = document.getElementById('lazyTree');
  lazyTree.nodes = [
    {
      id: 'folder1',
      label: 'Click to load...',
      icon: '📁',
      lazy: true,
      children: []
    }
  ];

  lazyTree.addEventListener('tree-node-lazy-load', async (e) => {
    const node = e.detail.node;
    const data = await fetch(`/api/nodes/${node.id}`).then(r => r.json());

    node.children = data.map(item => ({
      id: item.id,
      label: item.name,
      icon: '📄'
    }));
    node.lazy = false;
    node.expanded = true;

    // Trigger re-render
    lazyTree.nodes = [...lazyTree.nodes];
  });
</script>

<!-- Custom icons with images -->
<snice-tree id="imgTree"></snice-tree>
<script>
  document.getElementById('imgTree').nodes = [
    {
      id: '1',
      label: 'Images',
      iconImage: '/icons/folder.png',
      children: [
        { id: '2', label: 'photo.jpg', iconImage: '/icons/image.png' }
      ]
    }
  ];
</script>

<!-- Disabled nodes -->
<snice-tree id="disabledTree"></snice-tree>
<script>
  document.getElementById('disabledTree').nodes = [
    { id: '1', label: 'Active Node' },
    { id: '2', label: 'Disabled Node', disabled: true }
  ];
</script>
```

## Features

- Hierarchical data display
- Expand/collapse nodes
- Single/multiple/no selection modes
- Checkbox support for multi-select
- Text and image icons
- Lazy loading for large trees
- Disabled nodes
- Keyboard navigation (Arrow keys, Enter, Space, Home, End)
- Full ARIA accessibility
- Programmatic control
- Custom data storage per node
