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
- `tree` - Tree layout wrapper
- `node` - Individual node cards

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
