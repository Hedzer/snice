# snice-org-chart

Hierarchical organizational chart with expand/collapse, avatars, and two layout directions.

## Properties

```ts
data: OrgChartNode | null                // Root node of the tree
direction: 'top-down' | 'left-right'     // Layout direction (default: 'top-down')
compact: boolean                         // Compact node display (default: false)
```

### OrgChartNode

```ts
interface OrgChartNode {
  id: string;
  name: string;
  title?: string;                        // Job title / role
  avatar?: string;                       // Avatar image URL
  children?: OrgChartNode[];
}
```

## Methods

- `collapseNode(id: string)` -- Collapse a specific node
- `expandNode(id: string)` -- Expand a specific node
- `expandAll()` -- Expand all nodes
- `collapseAll()` -- Collapse all nodes

## Events

- `node-click` -> `{ node: OrgChartNode }` -- Node clicked
- `node-expand` -> `{ node: OrgChartNode }` -- Node expanded
- `node-collapse` -> `{ node: OrgChartNode }` -- Node collapsed

**CSS Parts:**
- `base` - The outer chart container
- `tree` - The tree layout wrapper
- `node` - Individual node cards

## Usage

```html
<snice-org-chart direction="top-down"></snice-org-chart>
```

```typescript
chart.data = {
  id: 'ceo',
  name: 'Jane Smith',
  title: 'CEO',
  avatar: '/avatars/jane.jpg',
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
