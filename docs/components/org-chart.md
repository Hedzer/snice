<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/org-chart.md -->

# Org Chart
`<snice-org-chart>`

A hierarchical organizational chart with expand/collapse functionality, avatars, and two layout directions.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Data Types](#data-types)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `OrgChartNode \| null` | `null` | Root node of the tree (set via JS) |
| `direction` | `'top-down' \| 'left-right'` | `'top-down'` | Layout direction |
| `compact` | `boolean` | `false` | Compact node display |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `collapseNode()` | `id: string` | Collapse a specific node by ID |
| `expandNode()` | `id: string` | Expand a specific node by ID |
| `expandAll()` | -- | Expand all nodes in the tree |
| `collapseAll()` | -- | Collapse all nodes in the tree |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `node-click` | `{ node: OrgChartNode }` | Fired when a node is clicked |
| `node-expand` | `{ node: OrgChartNode }` | Fired when a node is expanded |
| `node-collapse` | `{ node: OrgChartNode }` | Fired when a node is collapsed |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer chart container |
| `empty` | `<div>` | The placeholder shown when no data is provided |
| `tree` | `<div>` | The tree layout wrapper |
| `branch` | `<div>` | The wrapper around one child subtree |
| `node-wrapper` | `<div>` | The tree item wrapping a node and its children |
| `node` | `<div>` | Individual node cards |
| `avatar` | `<img>` or `<div>` | The node avatar, image or initials placeholder |
| `avatar-placeholder` | `<div>` | Added to `avatar` when initials are shown |
| `node-info` | `<div>` | The node text block |
| `node-name` | `<span>` | The node name |
| `node-title` | `<span>` | The node title |
| `toggle` | `<button>` | The collapse/expand button |
| `icon` | `<svg>` | Shared token on the collapse/expand icon |
| `toggle-icon` | `<svg>` | The collapse/expand button icon |
| `children` | `<div>` | The container of a node's children |

State tokens are added alongside the base token, so they are matched with
`::part(node node-compact)`.

| Token | Description |
|-------|-------------|
| `tree-left-right` | Added to `tree` while `direction` is `left-right` |
| `node-compact` | Added to `node` in compact mode |
| `avatar-compact` | Added to `avatar` in compact mode |
| `toggle-collapsed` | Added to `toggle` while the branch is collapsed |
| `toggle-expanded` | Added to `toggle` while the branch is expanded |

```css
snice-org-chart::part(node) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## Basic Usage

```typescript
import 'snice/components/org-chart/snice-org-chart';
```

```html
<snice-org-chart id="chart" direction="top-down"></snice-org-chart>

<script type="module">
  const chart = document.getElementById('chart');
  chart.data = {
    id: 'ceo',
    name: 'Jane Smith',
    title: 'CEO',
    avatar: '/avatars/jane.jpg',
    children: [
      { id: 'cto', name: 'Bob Jones', title: 'CTO', children: [
        { id: 'dev1', name: 'Alice Chen', title: 'Senior Engineer' },
        { id: 'dev2', name: 'David Park', title: 'Engineer' }
      ]},
      { id: 'cfo', name: 'Carol White', title: 'CFO' }
    ]
  };
</script>
```

## Examples

### Left-Right Layout

Use `direction="left-right"` for a horizontal tree layout.

```html
<snice-org-chart direction="left-right"></snice-org-chart>
```

### Compact Mode

Use the `compact` attribute for smaller node cards.

```html
<snice-org-chart compact></snice-org-chart>
```

### Programmatic Expand/Collapse

Use methods to control the tree programmatically.

```typescript
chart.collapseAll();
chart.expandNode('cto');

chart.addEventListener('node-expand', (e) => {
  console.log('Expanded:', e.detail.node.name);
});

chart.addEventListener('node-collapse', (e) => {
  console.log('Collapsed:', e.detail.node.name);
});
```

### Interactive Node Selection

Listen for `node-click` events to display details or navigate.

```typescript
chart.addEventListener('node-click', (e) => {
  const node = e.detail.node;
  console.log(`Selected: ${node.name} (${node.title || 'No title'})`);
});
```

## Accessibility

- Node cards are interactive and clickable
- Expand/collapse toggle buttons are accessible
- Avatar placeholders display name initials when no image is provided
- Nodes display name, title, and optional avatar for clear identification

## Data Types

```typescript
interface OrgChartNode {
  id: string;                      // Unique identifier
  name: string;                    // Person's name
  title?: string;                  // Job title or role
  avatar?: string;                 // Avatar image URL
  children?: OrgChartNode[];       // Child nodes
}
```
