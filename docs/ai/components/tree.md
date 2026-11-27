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

- `base` - Root wrapper of the tree, and the row wrapper of a tree item
- `content` - Tree content area, and the clickable row of a tree item
- `content-selected` - Added to `content` while the item is selected
- `content-disabled` - Added to `content` while the node is disabled
- `loading` - Lazy-loading indicator
- `expander` - Expand and collapse control
- `expander-expanded` - Added to `expander` while the item is expanded
- `expander-hidden` - Added to `expander` when the node has no children
- `expander-icon` - Chevron glyph inside the expander
- `checkbox` - Node checkbox wrapper
- `icon` - Node icon wrapper
- `icon-image` - Node icon rendered as an image
- `icon-text` - Node icon rendered as text or an inline SVG
- `label` - Text label
- `children` - Nested children container
- `children-expanded` - Added to `children` while the branch is expanded
- `container` - Main tree container
- `item` - A `<snice-tree-item>` host at any depth
- `spinner-base` - Exported `base` of the loading spinner (outer container)
- `spinner-circle` - Exported `circle` of the loading spinner (arc SVG)
- `spinner-track` - Exported `track` of the loading spinner (arc background circle)
- `spinner-fill` - Exported `fill` of the loading spinner (arc animated circle)
- `spinner-dots` - Exported `dots` of the loading spinner (dots variant wrapper)
- `spinner-pulse` - Exported `pulse` of the loading spinner (pulse variant wrapper)
- `spinner-orbit` - Exported `orbit` of the loading spinner (orbit variant wrapper)
- `spinner-bars` - Exported `bars` of the loading spinner (bars variant wrapper)
- `spinner-dot` - Exported `dot` of the loading spinner (individual dot)
- `spinner-orbit-dot` - Exported `orbit-dot` of the loading spinner (orbit dot)
- `spinner-bar` - Exported `bar` of the loading spinner (individual bar)
- `spinner-ring` - Exported `ring` of the loading spinner (orbit ring)
- `spinner-ring-a` - Exported `ring-a` of the loading spinner (first orbit ring)
- `spinner-ring-b` - Exported `ring-b` of the loading spinner (second orbit ring)
- `spinner-ring-c` - Exported `ring-c` of the loading spinner (third orbit ring)
- `spinner-label` - Exported `label` of the loading spinner (label text)
- `checkbox-base` - Exported `base` of the node checkbox (outer label wrapper)
- `checkbox-input` - Exported `input` of the node checkbox (native input)
- `checkbox-checkbox` - Exported `checkbox` of the node checkbox (visual box)
- `checkbox-spinner` - Exported `spinner` of the node checkbox (loading spinner)
- `checkbox-label` - Exported `label` of the node checkbox (label text)
- `checkbox-icon` - Exported `icon` of the node checkbox (check/indeterminate glyph)
- `checkbox-icon-check` - Exported `icon-check` of the node checkbox (checkmark glyph)
- `checkbox-icon-indeterminate` - Exported `icon-indeterminate` of the node checkbox (dash glyph)
- `checkbox-base-disabled` - Exported `base-disabled` of the node checkbox (wrapper while disabled)
- `checkbox-base-loading` - Exported `base-loading` of the node checkbox (wrapper while loading)
- `checkbox-checkbox-invalid` - Exported `checkbox-invalid` of the node checkbox (box while invalid)
- `checkbox-checkbox-indeterminate` - Exported `checkbox-indeterminate` of the node checkbox (box while indeterminate)
- `checkbox-checkbox-loading` - Exported `checkbox-loading` of the node checkbox (box while loading)
- `checkbox-label-required` - Exported `label-required` of the node checkbox (label while required)
- `item-base` - Exported `base` of a tree item — row wrapper of a tree item
- `item-content` - Exported `content` of a tree item — tree content area, and the clickable row of a tree item
- `item-content-selected` - Exported `content-selected` of a tree item — added to `content` while the item is selected
- `item-content-disabled` - Exported `content-disabled` of a tree item — added to `content` while the node is disabled
- `item-loading` - Exported `loading` of a tree item — lazy-loading indicator
- `item-expander` - Exported `expander` of a tree item — expand and collapse control
- `item-expander-expanded` - Exported `expander-expanded` of a tree item — added to `expander` while the item is expanded
- `item-expander-hidden` - Exported `expander-hidden` of a tree item — added to `expander` when the node has no children
- `item-expander-icon` - Exported `expander-icon` of a tree item — chevron glyph inside the expander
- `item-checkbox` - Exported `checkbox` of a tree item — node checkbox wrapper
- `item-icon` - Exported `icon` of a tree item — node icon wrapper
- `item-icon-image` - Exported `icon-image` of a tree item — node icon rendered as an image
- `item-icon-text` - Exported `icon-text` of a tree item — node icon rendered as text or an inline SVG
- `item-label` - Exported `label` of a tree item — text label
- `item-children` - Exported `children` of a tree item — nested children container
- `item-children-expanded` - Exported `children-expanded` of a tree item — added to `children` while the branch is expanded
- `item-spinner-base` - Exported `spinner-base` of a tree item — exported `base` of the loading spinner (outer container)
- `item-spinner-circle` - Exported `spinner-circle` of a tree item — exported `circle` of the loading spinner (arc SVG)
- `item-spinner-track` - Exported `spinner-track` of a tree item — exported `track` of the loading spinner (arc background circle)
- `item-spinner-fill` - Exported `spinner-fill` of a tree item — exported `fill` of the loading spinner (arc animated circle)
- `item-spinner-dots` - Exported `spinner-dots` of a tree item — exported `dots` of the loading spinner (dots variant wrapper)
- `item-spinner-pulse` - Exported `spinner-pulse` of a tree item — exported `pulse` of the loading spinner (pulse variant wrapper)
- `item-spinner-orbit` - Exported `spinner-orbit` of a tree item — exported `orbit` of the loading spinner (orbit variant wrapper)
- `item-spinner-bars` - Exported `spinner-bars` of a tree item — exported `bars` of the loading spinner (bars variant wrapper)
- `item-spinner-dot` - Exported `spinner-dot` of a tree item — exported `dot` of the loading spinner (individual dot)
- `item-spinner-orbit-dot` - Exported `spinner-orbit-dot` of a tree item — exported `orbit-dot` of the loading spinner (orbit dot)
- `item-spinner-bar` - Exported `spinner-bar` of a tree item — exported `bar` of the loading spinner (individual bar)
- `item-spinner-ring` - Exported `spinner-ring` of a tree item — exported `ring` of the loading spinner (orbit ring)
- `item-spinner-ring-a` - Exported `spinner-ring-a` of a tree item — exported `ring-a` of the loading spinner (first orbit ring)
- `item-spinner-ring-b` - Exported `spinner-ring-b` of a tree item — exported `ring-b` of the loading spinner (second orbit ring)
- `item-spinner-ring-c` - Exported `spinner-ring-c` of a tree item — exported `ring-c` of the loading spinner (third orbit ring)
- `item-spinner-label` - Exported `spinner-label` of a tree item — exported `label` of the loading spinner (label text)
- `item-checkbox-base` - Exported `checkbox-base` of a tree item — exported `base` of the node checkbox (outer label wrapper)
- `item-checkbox-input` - Exported `checkbox-input` of a tree item — exported `input` of the node checkbox (native input)
- `item-checkbox-checkbox` - Exported `checkbox-checkbox` of a tree item — exported `checkbox` of the node checkbox (visual box)
- `item-checkbox-spinner` - Exported `checkbox-spinner` of a tree item — exported `spinner` of the node checkbox (loading spinner)
- `item-checkbox-label` - Exported `checkbox-label` of a tree item — exported `label` of the node checkbox (label text)
- `item-checkbox-icon` - Exported `checkbox-icon` of a tree item — exported `icon` of the node checkbox (check/indeterminate glyph)
- `item-checkbox-icon-check` - Exported `checkbox-icon-check` of a tree item — exported `icon-check` of the node checkbox (checkmark glyph)
- `item-checkbox-icon-indeterminate` - Exported `checkbox-icon-indeterminate` of a tree item — exported `icon-indeterminate` of the node checkbox (dash glyph)
- `item-checkbox-base-disabled` - Exported `checkbox-base-disabled` of a tree item — exported `base-disabled` of the node checkbox (wrapper while disabled)
- `item-checkbox-base-loading` - Exported `checkbox-base-loading` of a tree item — exported `base-loading` of the node checkbox (wrapper while loading)
- `item-checkbox-checkbox-invalid` - Exported `checkbox-checkbox-invalid` of a tree item — exported `checkbox-invalid` of the node checkbox (box while invalid)
- `item-checkbox-checkbox-indeterminate` - Exported `checkbox-checkbox-indeterminate` of a tree item — exported `checkbox-indeterminate` of the node checkbox (box while indeterminate)
- `item-checkbox-checkbox-loading` - Exported `checkbox-checkbox-loading` of a tree item — exported `checkbox-loading` of the node checkbox (box while loading)
- `item-checkbox-label-required` - Exported `checkbox-label-required` of a tree item — exported `label-required` of the node checkbox (label while required)

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
