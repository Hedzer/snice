# snice-org-chart

Hierarchical organizational chart with expand/collapse, avatars, and two layout directions.

## Properties

```typescript
data: OrgChartNode | null = null;                    // attr: none (JS only)
direction: 'top-down'|'left-right' = 'top-down';
compact: boolean = false;
```

## Methods

- `collapseNode(id: string)` - Collapse a specific node
- `expandNode(id: string)` - Expand a specific node
- `expandAll()` - Expand all nodes
- `collapseAll()` - Collapse all nodes

## Events

- `node-click` → `{ node: OrgChartNode }` - Node clicked
- `node-expand` → `{ node: OrgChartNode }` - Node expanded
- `node-collapse` → `{ node: OrgChartNode }` - Node collapsed

## CSS Parts

- `base` - Outer chart container
- `empty` - Placeholder shown when no data is provided
- `tree` - Tree layout wrapper
- `branch` - Wrapper around one child subtree
- `node-wrapper` - Tree item wrapper around a node and its children
- `node` - Individual node card
- `avatar` - Node avatar (image or initials placeholder)
- `avatar-placeholder` - Added to `avatar` when initials are shown instead of an image
- `node-info` - Node text block
- `node-name` - Node name
- `node-title` - Node title
- `toggle` - Collapse/expand button
- `icon` - Shared token on the collapse/expand `<svg>` icon
- `toggle-icon` - Collapse/expand button icon
- `children` - Container of a node's children

State tokens:

- `tree-left-right` - Added to `tree` while `direction` is `left-right`
- `node-compact` - Added to `node` in compact mode
- `avatar-compact` - Added to `avatar` in compact mode
- `toggle-collapsed` - Added to `toggle` while the branch is collapsed
- `toggle-expanded` - Added to `toggle` while the branch is expanded

## Basic Usage

```html
<snice-org-chart direction="top-down"></snice-org-chart>
```

```typescript
import 'snice/components/org-chart/snice-org-chart';

chart.data = {
  id: 'ceo', name: 'Jane Smith', title: 'CEO', avatar: '/avatars/jane.jpg',
  children: [
    { id: 'cto', name: 'Bob Jones', title: 'CTO', children: [
      { id: 'dev1', name: 'Alice', title: 'Engineer' }
    ]},
    { id: 'cfo', name: 'Carol White', title: 'CFO' }
  ]
};

chart.addEventListener('node-click', (e) => {
  console.log('Selected:', e.detail.node.name);
});
```

## Accessibility

- Nodes are clickable with expand/collapse toggle buttons
- Avatar placeholders show name initials

## Types

```typescript
interface OrgChartNode {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  children?: OrgChartNode[];
}
```
