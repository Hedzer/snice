[//]: # (AI: For a low-token version of this doc, use docs/ai/components/org-chart.md instead)

# Org Chart Component

`<snice-org-chart>`

A hierarchical organizational chart that renders tree-structured data with node cards, connecting lines, avatars, and expand/collapse functionality. Supports both top-down and left-right layout directions.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Types](#types)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```typescript
import 'snice/components/org-chart/snice-org-chart';
```

```html
<snice-org-chart direction="top-down"></snice-org-chart>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/org-chart/snice-org-chart';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-org-chart.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `OrgChartNode \| null` | `null` | Root node of the organizational tree (set via JavaScript) |
| `direction` | `'top-down' \| 'left-right'` | `'top-down'` | Layout direction for the chart |
| `compact` | `boolean` | `false` | Use compact node display with smaller cards |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `collapseNode()` | `id: string` | Collapse a specific node, hiding its children |
| `expandNode()` | `id: string` | Expand a specific node, showing its children |
| `expandAll()` | -- | Expand all nodes in the chart |
| `collapseAll()` | -- | Collapse all nodes in the chart |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `node-click` | `{ node: OrgChartNode }` | Fired when a node card is clicked |
| `node-expand` | `{ node: OrgChartNode }` | Fired when a node is expanded |
| `node-collapse` | `{ node: OrgChartNode }` | Fired when a node is collapsed |

## Types

### OrgChartNode

```typescript
interface OrgChartNode {
  id: string;                    // Unique identifier for the node
  name: string;                  // Person's name displayed on the card
  title?: string;                // Job title or role
  avatar?: string;               // Avatar image URL
  children?: OrgChartNode[];     // Child nodes in the hierarchy
}
```

## Examples

### Basic Org Chart

Provide a tree data structure to render a top-down organizational chart.

```html
<snice-org-chart id="org" direction="top-down"></snice-org-chart>

<script type="module">
  import 'snice/components/org-chart/snice-org-chart';

  const chart = document.getElementById('org');
  chart.data = {
    id: 'ceo',
    name: 'Jane Smith',
    title: 'CEO',
    avatar: '/avatars/jane.jpg',
    children: [
      {
        id: 'cto',
        name: 'Bob Jones',
        title: 'CTO',
        children: [
          { id: 'dev1', name: 'Alice Chen', title: 'Senior Engineer' },
          { id: 'dev2', name: 'David Park', title: 'Engineer' }
        ]
      },
      {
        id: 'cfo',
        name: 'Carol White',
        title: 'CFO',
        children: [
          { id: 'acc1', name: 'Eve Brown', title: 'Accountant' }
        ]
      }
    ]
  };
</script>
```

### Left-to-Right Layout

Use `direction="left-right"` for a horizontal chart layout.

```html
<snice-org-chart id="horizontal-org" direction="left-right"></snice-org-chart>

<script type="module">
  import 'snice/components/org-chart/snice-org-chart';

  const chart = document.getElementById('horizontal-org');
  chart.data = {
    id: 'root',
    name: 'Engineering',
    title: 'Department',
    children: [
      {
        id: 'frontend',
        name: 'Frontend Team',
        title: 'Team Lead: Maria',
        children: [
          { id: 'fe1', name: 'Tom', title: 'React Developer' },
          { id: 'fe2', name: 'Lisa', title: 'UI Engineer' }
        ]
      },
      {
        id: 'backend',
        name: 'Backend Team',
        title: 'Team Lead: James',
        children: [
          { id: 'be1', name: 'Sam', title: 'API Engineer' },
          { id: 'be2', name: 'Nina', title: 'Database Admin' }
        ]
      }
    ]
  };
</script>
```

### Compact Mode

Set the `compact` attribute for smaller node cards, useful for large organizations.

```html
<snice-org-chart id="compact-org" compact></snice-org-chart>

<script type="module">
  import 'snice/components/org-chart/snice-org-chart';

  const chart = document.getElementById('compact-org');
  chart.data = {
    id: 'ceo',
    name: 'Jane Smith',
    title: 'CEO',
    children: [
      { id: 'vp1', name: 'VP Engineering', title: 'VP' },
      { id: 'vp2', name: 'VP Sales', title: 'VP' },
      { id: 'vp3', name: 'VP Marketing', title: 'VP' },
      { id: 'vp4', name: 'VP Operations', title: 'VP' }
    ]
  };
</script>
```

### Interactive Node Selection

Listen for `node-click` events to display details or navigate when a node is selected.

```html
<snice-org-chart id="interactive-org"></snice-org-chart>
<div id="selected-info" style="margin-top: 1rem;"></div>

<script type="module">
  import 'snice/components/org-chart/snice-org-chart';

  const chart = document.getElementById('interactive-org');
  const info = document.getElementById('selected-info');

  chart.data = {
    id: 'ceo',
    name: 'Jane Smith',
    title: 'CEO',
    avatar: '/avatars/jane.jpg',
    children: [
      { id: 'cto', name: 'Bob Jones', title: 'CTO', avatar: '/avatars/bob.jpg' },
      { id: 'cfo', name: 'Carol White', title: 'CFO', avatar: '/avatars/carol.jpg' }
    ]
  };

  chart.addEventListener('node-click', (e) => {
    const node = e.detail.node;
    info.textContent = `Selected: ${node.name} (${node.title || 'No title'})`;
  });
</script>
```

### Programmatic Expand/Collapse

Use methods to control which branches of the tree are visible.

```html
<snice-org-chart id="controlled-org"></snice-org-chart>
<button id="expand-all">Expand All</button>
<button id="collapse-all">Collapse All</button>

<script type="module">
  import 'snice/components/org-chart/snice-org-chart';

  const chart = document.getElementById('controlled-org');
  chart.data = {
    id: 'root',
    name: 'Company',
    title: 'Organization',
    children: [
      {
        id: 'dept1',
        name: 'Engineering',
        title: 'Department',
        children: [
          { id: 'team1', name: 'Frontend', title: 'Team' },
          { id: 'team2', name: 'Backend', title: 'Team' }
        ]
      },
      {
        id: 'dept2',
        name: 'Marketing',
        title: 'Department',
        children: [
          { id: 'team3', name: 'Content', title: 'Team' },
          { id: 'team4', name: 'Growth', title: 'Team' }
        ]
      }
    ]
  };

  document.getElementById('expand-all').addEventListener('click', () => chart.expandAll());
  document.getElementById('collapse-all').addEventListener('click', () => chart.collapseAll());

  chart.addEventListener('node-expand', (e) => {
    console.log('Expanded:', e.detail.node.name);
  });

  chart.addEventListener('node-collapse', (e) => {
    console.log('Collapsed:', e.detail.node.name);
  });
</script>
```

## Accessibility

- Node cards are interactive and clickable
- Expand/collapse controls are accessible for toggling subtree visibility
- The chart uses connecting lines to visually represent the hierarchy
- Nodes display name, title, and optional avatar for clear identification
- Keyboard users can interact with node cards to trigger click events
