<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/sankey.md -->

# Sankey

An SVG-based Sankey diagram for visualizing flow between categories.

## Table of Contents

- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `SankeyData` | `{ nodes: [], links: [] }` | Nodes and links data (JS only) |
| `nodeWidth` (attr: `node-width`) | `number` | `20` | Width of node rectangles |
| `nodePadding` (attr: `node-padding`) | `number` | `10` | Vertical padding between nodes |
| `alignment` | `'left' \| 'right' \| 'center' \| 'justify'` | `'justify'` | Leaf node alignment |
| `showLabels` (attr: `show-labels`) | `boolean` | `true` | Show node labels |
| `showValues` (attr: `show-values`) | `boolean` | `true` | Show node values |
| `animation` | `boolean` | `false` | Animate on initial render |

### Type Interfaces

```typescript
interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyNode {
  id: string;
  label?: string;   // Defaults to id
  color?: string;    // Auto-assigned if omitted
}

interface SankeyLink {
  source: string;    // Source node id
  target: string;    // Target node id
  value: number;     // Flow value (determines link width)
  color?: string;    // Defaults to source node color
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `sankey-node-click` | `{ node: SankeyNode }` | Node clicked |
| `sankey-link-click` | `{ link: SankeyLink }` | Link clicked |
| `sankey-hover` | `{ type: 'node' \| 'link', item } \| null` | Hover state changed (null on mouse leave) |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer Sankey container |
| `chart` | The SVG chart area |
| `tooltip` | The hover tooltip |

## Basic Usage

```typescript
import 'snice/components/sankey/snice-sankey';
```

```html
<snice-sankey show-labels show-values style="height: 300px;"></snice-sankey>
```

```typescript
sankey.data = {
  nodes: [
    { id: 'source', label: 'Source', color: '#2196f3' },
    { id: 'target', label: 'Target', color: '#4caf50' }
  ],
  links: [
    { source: 'source', target: 'target', value: 100 }
  ]
};
```

## Examples

### Energy Flow

A multi-level Sankey diagram showing energy sources flowing to consumers.

```typescript
sankey.data = {
  nodes: [
    { id: 'solar', label: 'Solar', color: '#f59e0b' },
    { id: 'wind', label: 'Wind', color: '#3b82f6' },
    { id: 'electric', label: 'Electricity', color: '#8b5cf6' },
    { id: 'residential', label: 'Residential', color: '#10b981' },
    { id: 'commercial', label: 'Commercial', color: '#06b6d4' }
  ],
  links: [
    { source: 'solar', target: 'electric', value: 120 },
    { source: 'wind', target: 'electric', value: 90 },
    { source: 'electric', target: 'residential', value: 130 },
    { source: 'electric', target: 'commercial', value: 80 }
  ]
};
```

### Alignment Options

Use `alignment` to control how leaf nodes are positioned.

```html
<snice-sankey alignment="left" show-labels></snice-sankey>
<snice-sankey alignment="justify" show-labels></snice-sankey>
```

### Custom Node Width and Padding

Use `node-width` and `node-padding` to adjust the layout.

```html
<snice-sankey node-width="30" node-padding="20" show-labels style="height: 300px;"></snice-sankey>
```

### Animation

Set `animation` for animated rendering on initial load.

```html
<snice-sankey animation show-labels show-values></snice-sankey>
```

### Event Handling

Listen for click and hover events on nodes and links.

```typescript
sankey.addEventListener('sankey-node-click', (e) => {
  console.log('Node:', e.detail.node.label);
});

sankey.addEventListener('sankey-link-click', (e) => {
  console.log('Link:', e.detail.link.source, '->', e.detail.link.target);
});

sankey.addEventListener('sankey-hover', (e) => {
  if (e.detail) {
    console.log('Hovering:', e.detail.type, e.detail.item);
  }
});
```

## Accessibility

- SVG rendered with `role="img"` and `aria-label`
- Hover highlights connected nodes/links and dims others
- Tooltips show node/link details on hover
- Responsive sizing via `ResizeObserver`
